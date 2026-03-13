/**
 * Direct CLI mode — flag parsing and scan pipeline orchestration.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import pLimit from 'p-limit';
import type { AxeResults } from 'axe-core';
import { fetchSitemap } from '../sitemap/fetcher.js';
import { filterUrls, type FilterOptions } from '../sitemap/filter.js';
import { buildAxeConfig } from '../scanner/axe.js';
import { ScannerManager } from '../scanner/playwright.js';
import { analyzePatterns, type ViolationPattern } from '../analyzer/patterns.js';
import { writeCSV } from '../reporter/csv.js';
import { writeJSON, sanitizeFilename, prepareSiteReportsDir, groupPatterns, autoPrune, pruneReports, listSites, listRuns, type JsonReport, type SkippedUrl } from '../reporter/json.js';
import { writeHTML } from '../reporter/html.js';
import { writeMarkdown } from '../reporter/markdown.js';
import { createInterface } from 'node:readline';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { runWizard } from './wizard.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getVersion(): string {
  try {
    const pkgPath = join(__dirname, '..', '..', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    return pkg.version || '1.0.0';
  } catch {
    return '1.0.0';
  }
}

function askYesNo(prompt: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y');
    });
  });
}

function generateTimestamp(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}-${h}${min}`;
}

/**
 * Extract the path section from a URL like "example.com/about" or "https://example.com/research/articles".
 * Returns the path (e.g., "/about") or null if no meaningful path.
 */
function extractSectionPath(input: string): string | null {
  let url = input;
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.replace(/\/+$/, '');
    // Ignore root path, sitemap paths, and paths ending in .xml
    if (!pathname || pathname === '/' || /\.xml$/i.test(pathname)) {
      return null;
    }
    return pathname;
  } catch {
    return null;
  }
}

/**
 * Resolve the sitemap URL from a bare site URL or explicit --sitemap flag.
 * If given "https://example.com/about", discovers sitemap at the site root.
 * Returns the resolved sitemap URL or null if unreachable.
 */
async function resolveSitemapUrl(input: string): Promise<string | null> {
  // Auto-prepend https:// if no protocol is present
  if (!/^https?:\/\//i.test(input)) {
    input = `https://${input}`;
  }

  // If it already ends with .xml, use as-is
  if (/\.xml$/i.test(input)) {
    return input;
  }

  // Always discover sitemap at the site root, regardless of path
  try {
    const parsed = new URL(input);
    const rootCandidate = `${parsed.protocol}//${parsed.host}/sitemap.xml`;

    const res = await fetch(rootCandidate, { method: 'HEAD', signal: AbortSignal.timeout(10000) });
    if (res.ok) {
      return rootCandidate;
    }
  } catch {
    // fetch failed — sitemap not reachable
  }
  return null;
}

export function createProgram(): Command {
  const version = getVersion();

  const program = new Command()
    .name('a11yscan')
    .description('Pattern-aware accessibility auditor for ARIA roles, accessible names, and color contrast')
    .version(version)
    .argument('[url]', 'Site URL (auto-appends /sitemap.xml) or full sitemap URL')
    .option('--sitemap <url>', 'Explicit URL to sitemap.xml')
    .option('--filter <path>', 'Path prefix to include (e.g., /research)')
    .option('--filter-glob <pattern>', 'Glob pattern to match URL pathnames')
    .option('--exclude <paths>', 'Comma-separated path prefixes to exclude')
    .option('--depth <n>', 'Max URL path depth to include', parseInt)
    .option('--limit <n>', 'Max number of pages to scan', parseInt)
    .option('--output <formats>', 'Comma-separated output formats: csv, json, html', 'csv,json,html')
    .option('--filename <name>', 'Base filename for reports')
    .option('--concurrency <n>', 'Parallel pages to scan (1-5)', parseInt, 5)
    .option('--keep <n>', 'Report runs to keep per site/section (0 = no pruning)', parseInt, 3)
    .option('--ci', 'CI mode: minimal output, exit 1 on violations', false)
    .action(async (url, opts) => {
      // No URL and no --sitemap: launch interactive wizard
      if (!url && !opts.sitemap && !opts.ci) {
        const wizardResult = await runWizard();
        url = wizardResult.siteUrl;
        if (wizardResult.sitemapUrl) {
          opts.sitemap = wizardResult.sitemapUrl;
        }
        if (wizardResult.filter) {
          opts.filter = wizardResult.filter;
        }
        if (wizardResult.exclude) {
          opts.exclude = wizardResult.exclude;
        }
        opts.output = wizardResult.output;
        opts.concurrency = wizardResult.concurrency;
        opts.keep = wizardResult.keep;
      }

      // Resolve sitemap URL from positional arg or --sitemap flag
      let sitemapUrl: string | undefined = opts.sitemap;

      // Extract section path from URL (e.g., "example.com/about" → "/about")
      // Use it as implicit --filter unless explicit --filter is provided
      let sectionPath: string | null = null;
      if (url && !opts.filter) {
        sectionPath = extractSectionPath(url);
        if (sectionPath) {
          opts.filter = sectionPath;
        }
      }

      if (!sitemapUrl && url) {
        const isCi = opts.ci;
        // Normalize: auto-prepend https:// if missing
        const normalizedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
        // Always show root domain for sitemap discovery
        const parsed = new URL(normalizedUrl);
        const rootUrl = `${parsed.protocol}//${parsed.host}`;
        if (!isCi) {
          process.stdout.write(chalk.dim(`Checking for sitemap at ${rootUrl}/sitemap.xml... `));
        }
        const resolved = await resolveSitemapUrl(normalizedUrl);
        if (resolved) {
          sitemapUrl = resolved;
          if (!isCi) {
            console.log(chalk.green('found'));
            if (sectionPath) {
              console.log(chalk.dim(`  Section filter: ${chalk.cyan(sectionPath)}`));
            }
          }
        } else {
          if (!isCi) {
            console.log(chalk.red('not found'));
            console.error(
              chalk.red(`\nError: Could not find a sitemap at ${rootUrl}/sitemap.xml`) +
              chalk.dim('\n  Specify the sitemap URL directly: a11yscan --sitemap <url>')
            );
          }
          process.exit(2);
        }
      }

      if (!sitemapUrl) {
        console.error(chalk.red('Error: Provide a site URL or use --sitemap <url>'));
        program.help();
        process.exit(2);
      }

      opts.sitemap = sitemapUrl;
      opts.sectionPath = sectionPath;
      await runScan(opts, version);
    });

  // Subcommand: prune old report runs
  program
    .command('prune')
    .description('Remove old report runs, keeping the latest N per site/section')
    .argument('[site]', 'Site hostname to prune (omit to list all sites)')
    .option('--keep <n>', 'Number of runs to keep', parseInt, 3)
    .option('--section <path>', 'Section path within the site (e.g., /about)')
    .option('--all', 'Prune all sites', false)
    .action(async (site, pruneOpts) => {
      const { resolve: resolvePath } = await import('node:path');
      const { readdir } = await import('node:fs/promises');
      const reportsRoot = resolvePath(process.cwd(), 'reports');

      // List sites if no site specified and not --all
      if (!site && !pruneOpts.all) {
        const sites = await listSites();
        if (sites.length === 0) {
          console.log(chalk.yellow('No report sites found in ./reports/'));
          process.exit(0);
        }
        console.log(chalk.bold('\nSites with reports:\n'));
        for (const s of sites) {
          const runs = await listRuns(s);
          console.log(`  ${chalk.white(s)} ${chalk.dim(`(${runs.length} run${runs.length !== 1 ? 's' : ''})`)}`);
        }
        console.log(chalk.dim('\nUsage: a11yscan prune <site> [--keep 3] [--section /about]'));
        console.log(chalk.dim('       a11yscan prune --all [--keep 3]\n'));
        process.exit(0);
      }

      const keep = pruneOpts.keep;

      // Prune all sites
      if (pruneOpts.all) {
        const sites = await listSites();
        let totalPruned = 0;
        for (const s of sites) {
          const siteDir = resolvePath(reportsRoot, s);
          // Check for section subdirectories vs direct timestamp dirs
          let entries: string[];
          try {
            entries = await readdir(siteDir);
          } catch {
            continue;
          }
          const timestampPattern = /^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/;
          const hasTimestamps = entries.some((e) => timestampPattern.test(e));

          if (hasTimestamps) {
            const pruned = await pruneReports(siteDir, keep);
            totalPruned += pruned.length;
            if (pruned.length > 0) {
              console.log(`  ${chalk.white(s)}: pruned ${chalk.yellow(String(pruned.length))} run(s)`);
            }
          }

          // Also check section subdirectories
          for (const entry of entries) {
            if (!timestampPattern.test(entry)) {
              const subDir = resolvePath(siteDir, entry);
              const pruned = await pruneReports(subDir, keep);
              totalPruned += pruned.length;
              if (pruned.length > 0) {
                console.log(`  ${chalk.white(s)}/${entry}: pruned ${chalk.yellow(String(pruned.length))} run(s)`);
              }
            }
          }
        }
        console.log(chalk.dim(`\nTotal: ${totalPruned} old run(s) removed (keeping latest ${keep})`));
        process.exit(0);
      }

      // Prune a specific site
      const section = pruneOpts.section?.replace(/^\/+/, '');
      const targetDir = section
        ? resolvePath(reportsRoot, site, section)
        : resolvePath(reportsRoot, site);

      const runs = section ? await listRuns(site, section) : await listRuns(site);
      if (runs.length === 0) {
        console.log(chalk.yellow(`No report runs found for ${site}${section ? '/' + section : ''}`));
        process.exit(0);
      }

      console.log(chalk.dim(`\n${site}${section ? '/' + section : ''}: ${runs.length} run(s) found`));

      const pruned = await pruneReports(targetDir, keep);
      if (pruned.length === 0) {
        console.log(chalk.green(`  Nothing to prune (${runs.length} ≤ ${keep})`));
      } else {
        for (const p of pruned) {
          const dirName = p.split('/').pop();
          console.log(`  ${chalk.red('✕')} ${chalk.dim(dirName!)}`);
        }
        console.log(chalk.dim(`\n  Removed ${pruned.length} run(s), kept latest ${keep}`));
      }
      process.exit(0);
    });

  return program;
}

interface ScanOptions {
  sitemap: string;
  filter?: string;
  filterGlob?: string;
  exclude?: string;
  depth?: number;
  limit?: number;
  output: string;
  filename?: string;
  concurrency: number;
  keep: number;
  ci: boolean;
  sectionPath?: string | null;
}

async function runScan(opts: ScanOptions, version: string): Promise<void> {
  const isCi = opts.ci;

  // Validate concurrency
  const concurrency = Math.max(1, Math.min(5, opts.concurrency || 3));
  if (opts.concurrency > 5 || opts.concurrency < 1) {
    if (!isCi) {
      console.error(chalk.red('Error: --concurrency must be between 1 and 5.'));
    }
    process.exit(2);
  }

  // Validate and sanitize filename
  const filename = opts.filename
    ? sanitizeFilename(opts.filename)
    : `aria-report-${generateTimestamp()}`;

  // Parse output formats
  const formats = opts.output.split(',').map((f) => f.trim().toLowerCase());
  const validFormats = ['csv', 'json', 'html', 'md'];
  for (const f of formats) {
    if (!validFormats.includes(f)) {
      if (!isCi) {
        console.error(chalk.red(`Error: Unknown output format "${f}". Valid formats: ${validFormats.join(', ')}`));
      }
      process.exit(2);
    }
  }

  // Parse exclude list
  const excludeList = opts.exclude
    ? opts.exclude.split(',').map((e) => e.trim()).filter((e) => e.length > 0)
    : [];

  if (!isCi) {
    console.log(chalk.bold.cyan(`a11yscan v${version}\n`));
  }

  // --- Fetch sitemap ---
  if (!isCi) {
    process.stdout.write(chalk.dim('Fetching sitemap... '));
  }

  let allUrls: string[] = [];
  try {
    const { urls, unsafeSkipped } = await fetchSitemap(opts.sitemap);
    allUrls = urls;
    if (unsafeSkipped.length > 0 && !isCi) {
      console.log(chalk.yellow(`\n  Skipped ${unsafeSkipped.length} unsafe URL(s) (private/localhost)`));
    }
  } catch (err) {
    if (!isCi) {
      console.error(chalk.red(`\nError: ${err instanceof Error ? err.message : String(err)}`));
    }
    process.exit(2);
  }

  if (!isCi) {
    console.log(chalk.green(`${allUrls.length.toLocaleString()} URLs found`));
  }

  // --- Filter URLs ---
  const filterOpts: FilterOptions = {
    filter: opts.filter,
    filterGlob: opts.filterGlob,
    exclude: excludeList.length > 0 ? excludeList : undefined,
    depth: opts.depth,
    limit: opts.limit,
  };

  const filteredUrls = filterUrls(allUrls, filterOpts);

  if (!isCi) {
    const filterDesc = opts.filter || opts.filterGlob || 'all pages';
    const excludeDesc = excludeList.length > 0 ? ` (excluding ${excludeList.join(', ')})` : '';
    console.log(
      chalk.dim('Applying filters... ') +
        chalk.green(`${filteredUrls.length.toLocaleString()} URLs matched ${filterDesc}${excludeDesc}`)
    );
  }

  if (filteredUrls.length === 0) {
    if (!isCi) {
      console.log(chalk.yellow('\nNo URLs matched the filter criteria. Nothing to scan.'));
    }
    process.exit(0);
  }

  // --- Scan pages ---
  if (!isCi) {
    console.log(chalk.dim(`\nScanning ${filteredUrls.length} pages with Playwright (concurrency: ${concurrency})...`));
  }

  // Prepare site-specific reports directory with optional section subfolder
  const siteReportsDir = await prepareSiteReportsDir(opts.sitemap, opts.sectionPath || undefined);

  const axeConfig = buildAxeConfig();
  const scanner = new ScannerManager();
  const scanResults = new Map<string, AxeResults>();
  const skippedUrls: SkippedUrl[] = [];
  let completedCount = 0;
  let interrupted = false;
  let interruptReason: string | undefined;

  // SIGINT handler for partial reports
  const sigintHandler = async () => {
    interrupted = true;
    interruptReason = 'User interrupted (SIGINT)';
    if (!isCi) {
      console.log(chalk.yellow('\n\nInterrupted. Writing partial reports...'));
    }
    await writeReports(
      scanResults, skippedUrls, filteredUrls.length, opts, formats,
      filename, version, true, interruptReason, undefined, siteReportsDir
    );
    await scanner.close();
    process.exit(3);
  };

  process.on('SIGINT', sigintHandler);

  try {
    await scanner.launch();
  } catch (err) {
    if (!isCi) {
      console.error(chalk.red(`\nFailed to launch browser: ${err instanceof Error ? err.message : String(err)}`));
    }
    process.exit(2);
  }

  const limit = pLimit(concurrency);

  const scanPromises = filteredUrls.map((url) =>
    limit(async () => {
      if (interrupted) return;

      // Check if browser is still alive
      if (!scanner.isConnected()) {
        const relaunched = await scanner.relaunch();
        if (!relaunched) {
          interrupted = true;
          interruptReason = 'Browser crashed and relaunch failed';
          return;
        }
        if (!isCi) {
          console.log(chalk.yellow('\n  Browser crashed — relaunched successfully'));
        }
      }

      const result = await scanner.scanPage(url, axeConfig);
      completedCount++;

      if (result) {
        scanResults.set(url, result);
      } else {
        skippedUrls.push({ url, reason: 'timeout' });
      }

      if (!isCi) {
        process.stdout.write(
          `\r${chalk.dim(`[${completedCount}/${filteredUrls.length}]`)} ${chalk.gray(url.substring(0, 80))}`
        );
      }
    })
  );

  await Promise.all(scanPromises);

  // Remove SIGINT handler
  process.removeListener('SIGINT', sigintHandler);

  if (interrupted) {
    if (!isCi) {
      console.log(chalk.red(`\n\n${interruptReason}. Writing partial reports...`));
    }
    await writeReports(
      scanResults, skippedUrls, filteredUrls.length, opts, formats,
      filename, version, true, interruptReason, undefined, siteReportsDir
    );
    await scanner.close();
    process.exit(3);
  }

  await scanner.close();

  // --- Analyze patterns ---
  const patterns = analyzePatterns(scanResults, scanResults.size);

  // --- Write reports ---
  const reportPaths = await writeReports(
    scanResults, skippedUrls, filteredUrls.length, opts, formats,
    filename, version, false, undefined, patterns, siteReportsDir
  );

  // --- Auto-prune old report runs ---
  if (opts.keep > 0) {
    const pruned = await autoPrune(siteReportsDir, opts.keep);
    if (pruned.length > 0 && !isCi) {
      console.log(chalk.dim(`\n  Pruned ${pruned.length} old report run(s) (keeping latest ${opts.keep})`));
    }
  }

  // --- Terminal output ---
  const totalViolations = patterns.reduce((sum, p) => sum + p.affectedPageCount, 0);

  if (!isCi) {
    console.log(chalk.bold('\n\nScan complete.\n'));
    console.log(`  Pages scanned:   ${chalk.green(scanResults.size.toString())}`);
    console.log(`  Pages skipped:   ${chalk.yellow(skippedUrls.length.toString())}${skippedUrls.length > 0 ? ' (timeout)' : ''}`);
    console.log(`  Total violations: ${chalk.red(totalViolations.toLocaleString())}`);
    console.log(`  Patterns found:   ${chalk.cyan(patterns.length.toString())}`);
    console.log(chalk.dim('\n  Reports saved to ./reports/'));
    for (const rp of reportPaths) {
      console.log(chalk.dim(`    ${rp}`));
    }
    console.log();

    // Offer to open HTML report
    const htmlPath = reportPaths.find((p) => p.endsWith('.html'));
    if (htmlPath) {
      const shouldOpen = await askYesNo('View HTML report in browser? (y/N) ');
      if (shouldOpen) {
        const { exec } = await import('node:child_process');
        const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
        exec(`${cmd} "${htmlPath}"`);
      }
    }
  }

  // CI mode JSON output
  if (isCi) {
    const ciOutput = {
      exitCode: totalViolations > 0 ? 1 : 0,
      pagesScanned: scanResults.size,
      pagesSkipped: skippedUrls.length,
      totalViolations,
      totalPatterns: patterns.length,
      criticalPatterns: patterns.filter((p) => p.impact === 'critical').length,
      seriousPatterns: patterns.filter((p) => p.impact === 'serious').length,
      reportFiles: reportPaths,
    };
    process.stdout.write(JSON.stringify(ciOutput, null, 2) + '\n');
  }

  // Exit code
  process.exit(totalViolations > 0 ? 1 : 0);
}

async function writeReports(
  scanResults: Map<string, AxeResults>,
  skippedUrls: SkippedUrl[],
  totalFilteredUrls: number,
  opts: ScanOptions,
  formats: string[],
  filename: string,
  version: string,
  interrupted: boolean,
  interruptReason?: string,
  patternsOverride?: ViolationPattern[],
  siteReportsDir?: string
): Promise<string[]> {
  const patterns = patternsOverride || analyzePatterns(scanResults, scanResults.size);
  const totalViolations = patterns.reduce((sum, p) => sum + p.affectedPageCount, 0);

  const reportPaths: string[] = [];

  const meta = {
    generatedAt: new Date().toISOString(),
    sitemap: opts.sitemap,
    filter: opts.filter || null,
    pagesScanned: scanResults.size,
    pagesSkipped: skippedUrls.length,
    totalViolations,
    totalPatterns: patterns.length,
    tool: 'a11yscan' as const,
    version,
    ...(interrupted && { interrupted: true, interruptReason }),
  };

  const report: JsonReport = {
    meta,
    patternGroups: groupPatterns(patterns),
    patterns,
    skippedUrls,
  };

  if (formats.includes('json')) {
    const path = await writeJSON(report, filename, siteReportsDir);
    reportPaths.push(path);
  }

  if (formats.includes('csv')) {
    const path = await writeCSV(patterns, filename, siteReportsDir);
    reportPaths.push(path);
  }

  if (formats.includes('html')) {
    const path = await writeHTML(report, filename, siteReportsDir);
    reportPaths.push(path);
  }

  if (formats.includes('md')) {
    const path = await writeMarkdown(report, filename, siteReportsDir);
    reportPaths.push(path);
  }

  return reportPaths;
}
