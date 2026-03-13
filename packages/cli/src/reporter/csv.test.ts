import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { writeCSV } from './csv.js';
import { readFile, rm, mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { ViolationPattern } from '../analyzer/patterns.js';

let REPORTS_DIR: string;

beforeAll(async () => {
  REPORTS_DIR = await mkdtemp(join(tmpdir(), 'a11yscan-test-csv-'));
});

const samplePatterns: ViolationPattern[] = [
  {
    patternId: 'P001',
    violationId: 'aria-roles',
    violationDescription: 'Ensures role attribute has appropriate value',
    impact: 'critical',
    normalizedSelector: '.v-autocomplete__content',
    affectedPageCount: 2,
    affectedUrls: ['https://example.com/a', 'https://example.com/b'],
    suggestedFix: 'https://dequeuniversity.com/rules/axe/4.x/aria-roles',
    rootCauseHint: 'Likely Vuetify component',
    htmlSnippet: '<div class="v-autocomplete__content" role="listbox"></div>',
    failureSummary: 'Fix any of the following: Role "listbox" is not allowed for given element',
    rawSelector: '.v-autocomplete__content',
  },
];

afterAll(async () => {
  try {
    await rm(REPORTS_DIR, { recursive: true, force: true });
  } catch {
    // Ignore
  }
});

describe('writeCSV', () => {
  it('produces valid CSV with correct column count', async () => {
    const filePath = await writeCSV(samplePatterns, 'test-csv-output');
    const content = await readFile(filePath, 'utf-8');

    const lines = content.trim().split('\n');
    // Header + 1 data row
    expect(lines.length).toBe(2);

    // 11 columns
    const headerCols = lines[0].split(',');
    expect(headerCols.length).toBe(11);
    expect(headerCols[0]).toBe('Violation Type');
    expect(headerCols[10]).toBe('Affected URLs');
  });

  it('pipe-separates affected URLs in last column', async () => {
    const filePath = await writeCSV(samplePatterns, 'test-csv-pipes');
    const content = await readFile(filePath, 'utf-8');

    const lines = content.trim().split('\n');
    const dataLine = lines[1];
    // The last field should contain pipe-separated URLs
    expect(dataLine).toContain('https://example.com/a|https://example.com/b');
  });

  it('auto-creates reports directory', async () => {
    // Remove reports dir first
    await rm(REPORTS_DIR, { recursive: true, force: true }).catch(() => {});

    const filePath = await writeCSV(samplePatterns, 'test-csv-autodir');
    expect(filePath).toContain('reports');

    const content = await readFile(filePath, 'utf-8');
    expect(content.length).toBeGreaterThan(0);
  });
});
