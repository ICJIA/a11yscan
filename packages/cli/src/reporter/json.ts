/**
 * JSON report writer — structured report with metadata, patterns, and skipped URLs.
 */

import { writeFile, mkdir, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { ViolationPattern } from '../analyzer/patterns.js';

const REPORTS_DIR = resolve(process.cwd(), 'reports');

/**
 * Derive a safe directory name from a sitemap URL's hostname.
 * e.g., "https://vuepress.vuejs.org/sitemap.xml" → "vuepress.vuejs.org"
 */
export function siteDir(sitemapUrl: string): string {
  try {
    const hostname = new URL(sitemapUrl).hostname.toLowerCase();
    return hostname.replace(/[^a-z0-9.-]/g, '');
  } catch {
    return 'unknown-site';
  }
}

/**
 * Get the site-specific reports directory and ensure it exists.
 * Clears any previous reports in the directory first (keeps only latest scan).
 */
export async function prepareSiteReportsDir(sitemapUrl: string): Promise<string> {
  const dir = resolve(REPORTS_DIR, siteDir(sitemapUrl));
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  return dir;
}

export interface SkippedUrl {
  url: string;
  reason: string;
}

export interface JsonReportMeta {
  generatedAt: string;
  sitemap: string;
  filter: string | null;
  pagesScanned: number;
  pagesSkipped: number;
  totalViolations: number;
  totalPatterns: number;
  tool: 'a11yscan';
  version: string;
  interrupted?: boolean;
  interruptReason?: string;
}

export interface JsonReport {
  meta: JsonReportMeta;
  patterns: ViolationPattern[];
  skippedUrls: SkippedUrl[];
}

/**
 * Sanitize a filename — reject path separators and dangerous characters.
 * Allows only [a-zA-Z0-9._-], truncates to 100 chars.
 */
export function sanitizeFilename(input: string): string {
  if (/[/\\]/.test(input) || input.includes('..')) {
    throw new Error(
      `Invalid filename "${input}": must not contain path separators (/ \\) or ".." sequences.`
    );
  }
  return input
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .substring(0, 100);
}

/**
 * Write a JSON report to disk.
 * Auto-creates ./reports/ directory if it doesn't exist.
 *
 * @returns The absolute path to the written JSON file.
 */
export async function writeJSON(
  report: JsonReport,
  filename: string,
  siteReportsDir?: string
): Promise<string> {
  const dir = siteReportsDir || REPORTS_DIR;
  await mkdir(dir, { recursive: true });

  const filePath = join(dir, `${filename}.json`);
  await writeFile(filePath, JSON.stringify(report, null, 2), 'utf-8');
  return filePath;
}
