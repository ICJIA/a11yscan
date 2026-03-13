import { describe, it, expect, afterAll } from 'vitest';
import { writeJSON, sanitizeFilename, groupPatterns, siteDir, prepareSiteReportsDir, type JsonReport } from './json.js';
import { readFile, rm, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { ViolationPattern } from '../analyzer/patterns.js';

const REPORTS_DIR = resolve(process.cwd(), 'reports');

const sampleReport: JsonReport = {
  meta: {
    generatedAt: '2026-03-13T14:00:00Z',
    sitemap: 'https://example.com/sitemap.xml',
    filter: '/research',
    pagesScanned: 10,
    pagesSkipped: 1,
    totalViolations: 5,
    totalPatterns: 2,
    tool: 'a11yscan',
    version: '1.0.0',
  },
  patternGroups: [],
  patterns: [
    {
      patternId: 'P001',
      violationId: 'aria-roles',
      violationDescription: 'Bad role',
      impact: 'critical',
      normalizedSelector: '.v-btn',
      affectedPageCount: 3,
      affectedUrls: ['https://example.com/a', 'https://example.com/b', 'https://example.com/c'],
      suggestedFix: 'https://dequeuniversity.com/rules/axe/4.x/aria-roles',
      rootCauseHint: 'Likely Vuetify component',
      htmlSnippet: '<div class="v-btn" role="invalid"></div>',
      failureSummary: 'Fix any of the following: Role "invalid" is not a valid ARIA role',
      rawSelector: '.v-btn',
    },
  ],
  skippedUrls: [
    { url: 'https://example.com/timeout', reason: 'timeout' },
  ],
};

afterAll(async () => {
  try {
    await rm(REPORTS_DIR, { recursive: true, force: true });
  } catch {
    // Ignore
  }
});

describe('writeJSON', () => {
  it('produces valid JSON with correct meta shape', async () => {
    const filePath = await writeJSON(sampleReport, 'test-json-output');
    const content = await readFile(filePath, 'utf-8');
    const parsed = JSON.parse(content);

    expect(parsed.meta).toBeDefined();
    expect(parsed.meta.tool).toBe('a11yscan');
    expect(parsed.meta.version).toBe('1.0.0');
    expect(parsed.meta.sitemap).toBe('https://example.com/sitemap.xml');
    expect(parsed.meta.pagesScanned).toBe(10);
    expect(parsed.meta.totalPatterns).toBe(2);
  });

  it('includes patterns array', async () => {
    const filePath = await writeJSON(sampleReport, 'test-json-patterns');
    const content = await readFile(filePath, 'utf-8');
    const parsed = JSON.parse(content);

    expect(Array.isArray(parsed.patterns)).toBe(true);
    expect(parsed.patterns).toHaveLength(1);
    expect(parsed.patterns[0].patternId).toBe('P001');
  });

  it('includes skippedUrls array', async () => {
    const filePath = await writeJSON(sampleReport, 'test-json-skipped');
    const content = await readFile(filePath, 'utf-8');
    const parsed = JSON.parse(content);

    expect(parsed.skippedUrls).toHaveLength(1);
    expect(parsed.skippedUrls[0].reason).toBe('timeout');
  });
});

describe('sanitizeFilename', () => {
  it('rejects filenames with path separators', () => {
    expect(() => sanitizeFilename('../../etc/passwd')).toThrow();
    expect(() => sanitizeFilename('path/to/file')).toThrow();
    expect(() => sanitizeFilename('path\\to\\file')).toThrow();
  });

  it('rejects filenames with ".." sequences', () => {
    expect(() => sanitizeFilename('file..name')).toThrow();
  });

  it('strips special characters', () => {
    expect(sanitizeFilename('my-report_2026.03')).toBe('my-report_2026.03');
    expect(sanitizeFilename('report<>name')).toBe('reportname');
  });

  it('truncates to 100 characters', () => {
    const longName = 'a'.repeat(150);
    expect(sanitizeFilename(longName).length).toBe(100);
  });

  it('accepts valid filenames', () => {
    expect(sanitizeFilename('aria-report-2026-03-13-1400')).toBe('aria-report-2026-03-13-1400');
    expect(sanitizeFilename('research-audit')).toBe('research-audit');
  });
});

const makePattern = (overrides: Partial<ViolationPattern> = {}): ViolationPattern => ({
  patternId: 'P001',
  violationId: 'color-contrast',
  violationDescription: 'Low contrast',
  impact: 'serious',
  normalizedSelector: '.text-muted',
  affectedPageCount: 5,
  affectedUrls: [],
  suggestedFix: 'https://example.com/fix',
  rootCauseHint: 'Component-level issue',
  htmlSnippet: '<span></span>',
  failureSummary: 'Fix contrast',
  rawSelector: '.text-muted',
  ...overrides,
});

describe('groupPatterns', () => {
  it('groups patterns by violationId', () => {
    const patterns: ViolationPattern[] = [
      makePattern({ patternId: 'P001', violationId: 'color-contrast', affectedPageCount: 3 }),
      makePattern({ patternId: 'P002', violationId: 'aria-roles', impact: 'critical', affectedPageCount: 2 }),
      makePattern({ patternId: 'P003', violationId: 'color-contrast', affectedPageCount: 4 }),
    ];

    const groups = groupPatterns(patterns);

    const violationIds = groups.map((g) => g.violationId);
    expect(violationIds).toContain('color-contrast');
    expect(violationIds).toContain('aria-roles');

    const ccGroup = groups.find((g) => g.violationId === 'color-contrast')!;
    expect(ccGroup.patterns).toHaveLength(2);
  });

  it('calculates patternCount and totalAffectedPages correctly', () => {
    const patterns: ViolationPattern[] = [
      makePattern({ patternId: 'P001', violationId: 'color-contrast', affectedPageCount: 10 }),
      makePattern({ patternId: 'P002', violationId: 'color-contrast', affectedPageCount: 5 }),
      makePattern({ patternId: 'P003', violationId: 'aria-roles', impact: 'critical', affectedPageCount: 3 }),
    ];

    const groups = groupPatterns(patterns);
    const ccGroup = groups.find((g) => g.violationId === 'color-contrast')!;

    expect(ccGroup.patternCount).toBe(2);
    expect(ccGroup.totalAffectedPages).toBe(15);
  });

  it('sorts groups by totalAffectedPages descending', () => {
    const patterns: ViolationPattern[] = [
      makePattern({ patternId: 'P001', violationId: 'aria-roles', impact: 'critical', affectedPageCount: 2 }),
      makePattern({ patternId: 'P002', violationId: 'color-contrast', affectedPageCount: 10 }),
      makePattern({ patternId: 'P003', violationId: 'link-name', impact: 'moderate', affectedPageCount: 5 }),
    ];

    const groups = groupPatterns(patterns);

    expect(groups[0].violationId).toBe('color-contrast');
    expect(groups[1].violationId).toBe('link-name');
    expect(groups[2].violationId).toBe('aria-roles');
  });
});

describe('siteDir', () => {
  it('extracts hostname from sitemap URL', () => {
    expect(siteDir('https://example.com/sitemap.xml')).toBe('example.com');
  });

  it('handles subdomain URLs', () => {
    expect(siteDir('https://vuepress.vuejs.org/sitemap.xml')).toBe('vuepress.vuejs.org');
  });

  it('lowercases the hostname', () => {
    expect(siteDir('https://EXAMPLE.COM/sitemap.xml')).toBe('example.com');
  });

  it('returns "unknown-site" for invalid URLs', () => {
    expect(siteDir('not-a-url')).toBe('unknown-site');
  });

  it('strips non-alphanumeric characters except dots and hyphens', () => {
    expect(siteDir('https://my_site.example.com/sitemap.xml')).toBe('mysite.example.com');
  });
});

describe('prepareSiteReportsDir', () => {
  it('creates a timestamped subdirectory', async () => {
    const dir = await prepareSiteReportsDir('https://example.com/sitemap.xml');

    // Should contain hostname in the path
    expect(dir).toContain('example.com');
    // Should contain a timestamp-like pattern (YYYY-MM-DD_HH-MM-SS)
    expect(dir).toMatch(/\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}/);

    // Directory should exist
    const stats = await stat(dir);
    expect(stats.isDirectory()).toBe(true);
  });
});
