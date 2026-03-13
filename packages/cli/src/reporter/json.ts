/**
 * JSON report writer — structured report with metadata, patterns, and skipped URLs.
 */

import { writeFile, mkdir } from 'node:fs/promises';
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
 * Get a timestamped site-specific reports directory and ensure it exists.
 * Each scan creates a new subfolder: reports/{hostname}/{timestamp}/
 * Previous scans are preserved for diffing.
 */
export async function prepareSiteReportsDir(sitemapUrl: string): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
  const dir = resolve(REPORTS_DIR, siteDir(sitemapUrl), timestamp);
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

export interface PatternGroup {
  violationId: string;
  violationDescription: string;
  impact: string;
  suggestedFix: string;
  patternCount: number;
  totalAffectedPages: number;
  patterns: ViolationPattern[];
}

export interface JsonReport {
  meta: JsonReportMeta;
  patternGroups: PatternGroup[];
  patterns: ViolationPattern[];
  skippedUrls: SkippedUrl[];
}

/**
 * Group flat patterns array into PatternGroup[] keyed by violationId.
 */
export function groupPatterns(patterns: ViolationPattern[]): PatternGroup[] {
  const groupMap = new Map<string, PatternGroup>();

  for (const p of patterns) {
    if (!groupMap.has(p.violationId)) {
      groupMap.set(p.violationId, {
        violationId: p.violationId,
        violationDescription: p.violationDescription,
        impact: p.impact,
        suggestedFix: p.suggestedFix,
        patternCount: 0,
        totalAffectedPages: 0,
        patterns: [],
      });
    }
    const group = groupMap.get(p.violationId)!;
    group.patterns.push(p);
    group.patternCount++;
    group.totalAffectedPages += p.affectedPageCount;
  }

  // Sort groups by total affected pages descending
  return Array.from(groupMap.values()).sort(
    (a, b) => b.totalAffectedPages - a.totalAffectedPages
  );
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
