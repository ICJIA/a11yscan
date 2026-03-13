import { describe, it, expect, afterAll } from 'vitest';
import { writeJSON, sanitizeFilename, type JsonReport } from './json.js';
import { readFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

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
