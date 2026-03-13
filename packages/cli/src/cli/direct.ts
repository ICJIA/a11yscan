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
import { writeJSON, sanitizeFilename, type JsonReport, type SkippedUrl } from '../reporter/json.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

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

function generateTimestamp(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}-${h}${min}`;
}

export function createProgram(): Command {
  const version = getVersion();

  const program = new Command()
    .name('a11yscan')
    .description('Pattern-aware accessibility auditor for ARIA roles, accessible names, and color contrast')
    .version(version)
    .requiredOption('--sitemap <url>', 'URL to sitemap.xml')
    .option('--filter <path>', 'Path prefix to include (e.g., /research)')
    .option('--filter-glob <pattern>', 'Glob pattern to match URL pathnames')
    .option('--exclude <paths>', 'Comma-separated path prefixes to exclude')
    .option('--depth <n>', 'Max URL path depth to include', parseInt)
    .option('--limit <n>', 'Max number of pages to scan', parseInt)
    .option('--output <formats>', 'Comma-separated output formats: csv, json', 'csv,json')
    .option('--filename <name>', 'Base filename for reports')
    .option('--concurrency <n>', 'Parallel pages to scan (1-5)', parseInt, 3)
    .option('--ci', 'CI mode: minimal output, exit 1 on violations', false)
    .action(async (opts) => {
      await runScan(opts, version);
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
  ci: boolean;
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
  const validFormats = ['csv', 'json'];
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
      filename, version, true, interruptReason
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
      filename, version, true, interruptReason
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
    filename, version, false, undefined, patterns
  );

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
  patternsOverride?: ViolationPattern[]
): Promise<string[]> {
  const patterns = patternsOverride || analyzePatterns(scanResults, scanResults.size);
  const totalViolations = patterns.reduce((sum, p) => sum + p.affectedPageCount, 0);

  const reportPaths: string[] = [];

  if (formats.includes('json')) {
    const report: JsonReport = {
      meta: {
        generatedAt: new Date().toISOString(),
        sitemap: opts.sitemap,
        filter: opts.filter || null,
        pagesScanned: scanResults.size,
        pagesSkipped: skippedUrls.length,
        totalViolations,
        totalPatterns: patterns.length,
        tool: 'a11yscan',
        version,
        ...(interrupted && { interrupted: true, interruptReason }),
      },
      patterns,
      skippedUrls,
    };
    const path = await writeJSON(report, filename);
    reportPaths.push(path);
  }

  if (formats.includes('csv')) {
    const path = await writeCSV(patterns, filename);
    reportPaths.push(path);
  }

  return reportPaths;
}
