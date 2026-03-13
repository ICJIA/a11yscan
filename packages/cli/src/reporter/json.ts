/**
 * JSON report writer — structured report with metadata, patterns, and skipped URLs.
 */

import { writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
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
 * If a sectionPath is provided: reports/{hostname}/{section}/{timestamp}/
 * Previous scans are preserved for diffing.
 */
export async function prepareSiteReportsDir(sitemapUrl: string, sectionPath?: string): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
  const hostname = siteDir(sitemapUrl);

  let dir: string;
  if (sectionPath) {
    // Convert "/research/articles" → "research/articles" (safe path segments)
    const safePath = sectionPath.replace(/^\/+/, '').replace(/[^a-zA-Z0-9/_-]/g, '');
    dir = resolve(REPORTS_DIR, hostname, safePath, timestamp);
  } else {
    dir = resolve(REPORTS_DIR, hostname, timestamp);
  }

  await mkdir(dir, { recursive: true });
  return dir;
}

/**
 * Prune old report runs in a directory, keeping the latest `keep` entries.
 * Timestamp directories sort lexicographically (YYYY-MM-DD_HH-MM-SS).
 * Returns the list of deleted directory paths.
 */
export async function pruneReports(parentDir: string, keep: number): Promise<string[]> {
  if (keep <= 0) return [];

  let entries: string[];
  try {
    entries = await readdir(parentDir);
  } catch {
    return [];
  }

  // Only consider directories matching the timestamp pattern
  const timestampPattern = /^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/;
  const timestampDirs = entries
    .filter((e) => timestampPattern.test(e))
    .sort()
    .reverse(); // newest first

  if (timestampDirs.length <= keep) return [];

  const toDelete = timestampDirs.slice(keep);
  const deleted: string[] = [];

  for (const dir of toDelete) {
    const fullPath = join(parentDir, dir);
    await rm(fullPath, { recursive: true, force: true });
    deleted.push(fullPath);
  }

  return deleted;
}

/**
 * Auto-prune after a scan: prune the parent directory of siteReportsDir.
 * The parent is the site or section directory containing timestamp folders.
 */
export async function autoPrune(siteReportsDir: string, keep: number): Promise<string[]> {
  if (keep <= 0) return [];
  const parentDir = dirname(siteReportsDir);
  return pruneReports(parentDir, keep);
}

/**
 * List all sites in the reports directory.
 */
export async function listSites(): Promise<string[]> {
  try {
    const entries = await readdir(REPORTS_DIR);
    return entries.sort();
  } catch {
    return [];
  }
}

/**
 * List all timestamp runs for a site (and optional section).
 */
export async function listRuns(site: string, section?: string): Promise<string[]> {
  const dir = section
    ? resolve(REPORTS_DIR, site, section)
    : resolve(REPORTS_DIR, site);

  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return [];
  }

  const timestampPattern = /^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/;
  return entries.filter((e) => timestampPattern.test(e)).sort().reverse();
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
