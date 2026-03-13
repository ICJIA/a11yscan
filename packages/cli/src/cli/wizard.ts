/**
 * Interactive wizard — walks the user through scan configuration
 * when a11yscan is invoked with no arguments.
 */

import chalk from 'chalk';
import { createInterface } from 'node:readline';
import { VALID_OUTPUT_FORMATS, DEFAULT_OUTPUT_FORMATS, DEFAULT_KEEP_REPORTS } from '../a11y.config.js';

export interface WizardResult {
  siteUrl: string;
  sitemapUrl: string | null;
  filter: string | null;
  exclude: string | null;
  output: string;
  concurrency: number;
  keep: number;
}

function ask(rl: ReturnType<typeof createInterface>, prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => resolve(answer.trim()));
  });
}

export async function runWizard(): Promise<WizardResult> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  console.log();
  console.log(chalk.bold.cyan('a11yscan') + chalk.dim(' — interactive scan builder'));
  console.log(chalk.dim('─'.repeat(45)));
  console.log();

  // 1. Site URL (required)
  let siteUrl = '';
  while (!siteUrl) {
    siteUrl = await ask(rl, chalk.white('Site URL ') + chalk.dim('(required)') + chalk.white(': '));
    if (!siteUrl) {
      console.log(chalk.red('  A site URL is required.'));
    }
  }

  // Strip protocol for display, normalize later
  const displayUrl = siteUrl.replace(/^https?:\/\//i, '').replace(/\/+$/, '');

  // 2. Sitemap location
  console.log();
  const sitemapInput = await ask(
    rl,
    chalk.white('Sitemap location ') + chalk.dim(`(default: ${displayUrl}/sitemap.xml)`) + chalk.white(': ')
  );
  const sitemapUrl = sitemapInput || null;

  // 3. Include paths
  console.log();
  console.log(chalk.dim('  Filter to specific sections. Examples: /about, /research/articles'));
  const filterInput = await ask(
    rl,
    chalk.white('Include paths ') + chalk.dim('(blank = all pages)') + chalk.white(': ')
  );
  const filter = filterInput || null;

  // 4. Exclude paths
  console.log();
  console.log(chalk.dim('  Exclude sections. Comma-separated: /blog,/archive'));
  const excludeInput = await ask(
    rl,
    chalk.white('Exclude paths ') + chalk.dim('(blank = none)') + chalk.white(': ')
  );
  const exclude = excludeInput || null;

  // 5. Output formats
  console.log();
  const defaultFmtStr = DEFAULT_OUTPUT_FORMATS.join(',');
  console.log(chalk.dim(`  Available formats: ${VALID_OUTPUT_FORMATS.join(', ')}`));
  const outputInput = await ask(
    rl,
    chalk.white('Output formats ') + chalk.dim(`(default: ${defaultFmtStr})`) + chalk.white(': ')
  );
  const output = outputInput || defaultFmtStr;

  // Validate output formats
  const formats = output.split(',').map((f) => f.trim().toLowerCase());
  for (const f of formats) {
    if (!(VALID_OUTPUT_FORMATS as readonly string[]).includes(f)) {
      console.log(chalk.red(`  Unknown format "${f}". Valid: ${VALID_OUTPUT_FORMATS.join(', ')}`));
      rl.close();
      process.exit(2);
    }
  }

  // 6. Concurrency
  console.log();
  const concurrencyInput = await ask(
    rl,
    chalk.white('Concurrency ') + chalk.dim('(1-5, default: 5)') + chalk.white(': ')
  );
  const concurrency = concurrencyInput ? Math.max(1, Math.min(5, parseInt(concurrencyInput, 10) || 5)) : 5;

  // 7. Keep reports
  console.log();
  console.log(chalk.dim(`  Auto-prune old report runs. 0 = keep all.`));
  const keepInput = await ask(
    rl,
    chalk.white('Keep latest N reports ') + chalk.dim(`(default: ${DEFAULT_KEEP_REPORTS})`) + chalk.white(': ')
  );
  const keep = keepInput ? Math.max(0, parseInt(keepInput, 10) || DEFAULT_KEEP_REPORTS) : DEFAULT_KEEP_REPORTS;

  rl.close();

  // Summary
  console.log();
  console.log(chalk.dim('─'.repeat(45)));
  console.log(chalk.bold('Scan configuration:'));
  console.log(`  ${chalk.dim('Site:')}         ${chalk.white(displayUrl)}`);
  console.log(`  ${chalk.dim('Sitemap:')}      ${chalk.white(sitemapUrl || `${displayUrl}/sitemap.xml`)}`);
  console.log(`  ${chalk.dim('Include:')}      ${chalk.white(filter || 'all pages')}`);
  console.log(`  ${chalk.dim('Exclude:')}      ${chalk.white(exclude || 'none')}`);
  console.log(`  ${chalk.dim('Output:')}       ${chalk.white(output)}`);
  console.log(`  ${chalk.dim('Concurrency:')}  ${chalk.white(String(concurrency))}`);
  console.log(`  ${chalk.dim('Keep reports:')} ${chalk.white(keep === 0 ? 'all' : `latest ${keep}`)}`);
  console.log(chalk.dim('─'.repeat(45)));
  console.log();

  return {
    siteUrl,
    sitemapUrl,
    filter,
    exclude,
    output,
    concurrency,
    keep,
  };
}
