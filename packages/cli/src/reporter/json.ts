/**
 * JSON report writer — structured report with metadata, patterns, and skipped URLs.
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { ViolationPattern } from '../analyzer/patterns.js';

const REPORTS_DIR = resolve(process.cwd(), 'reports');

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
  filename: string
): Promise<string> {
  await mkdir(REPORTS_DIR, { recursive: true });

  const filePath = join(REPORTS_DIR, `${filename}.json`);
  await writeFile(filePath, JSON.stringify(report, null, 2), 'utf-8');
  return filePath;
}
