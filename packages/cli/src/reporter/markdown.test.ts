import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { writeMarkdown } from './markdown.js';
import { readFile, rm, mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { JsonReport } from './json.js';

let REPORTS_DIR: string;

beforeAll(async () => {
  REPORTS_DIR = await mkdtemp(join(tmpdir(), 'a11yscan-test-md-'));
});

const sampleReport: JsonReport = {
  meta: {
    generatedAt: '2026-03-13T14:00:00Z',
    sitemap: 'https://example.com/sitemap.xml',
    filter: null,
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
      violationId: 'color-contrast',
      violationDescription: 'Ensures the contrast between foreground and background colors meets WCAG 2 AA',
      impact: 'serious',
      normalizedSelector: '.text-muted',
      affectedPageCount: 3,
      affectedUrls: ['https://example.com/a', 'https://example.com/b', 'https://example.com/c'],
      suggestedFix: 'https://dequeuniversity.com/rules/axe/4.x/color-contrast',
      rootCauseHint: 'Global component or template',
      htmlSnippet: '<span class="text-muted">Hello</span>',
      failureSummary: 'Fix any of the following: Element has insufficient color contrast',
      rawSelector: '.text-muted',
    },
    {
      patternId: 'P002',
      violationId: 'aria-roles',
      violationDescription: 'Ensures role attribute has appropriate value',
      impact: 'critical',
      normalizedSelector: '.v-btn',
      affectedPageCount: 2,
      affectedUrls: ['https://example.com/a', 'https://example.com/b'],
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

describe('writeMarkdown', () => {
  it('creates a .md file', async () => {
    const filePath = await writeMarkdown(sampleReport, 'test-md-output', REPORTS_DIR);
    expect(filePath).toMatch(/\.md$/);

    const content = await readFile(filePath, 'utf-8');
    expect(content.length).toBeGreaterThan(0);
  });

  it('contains proper markdown structure', async () => {
    const filePath = await writeMarkdown(sampleReport, 'test-md-structure', REPORTS_DIR);
    const content = await readFile(filePath, 'utf-8');

    // Top-level heading
    expect(content).toContain('# a11yscan Report');
    // Meta line
    expect(content).toContain('**Generated:**');
    expect(content).toContain('**Pages scanned:** 10');
    // Summary heading
    expect(content).toContain('## Summary');
  });

  it('groups patterns by violation type', async () => {
    const filePath = await writeMarkdown(sampleReport, 'test-md-groups', REPORTS_DIR);
    const content = await readFile(filePath, 'utf-8');

    // Each violation type should be an h2 section
    expect(content).toContain('## color-contrast (serious)');
    expect(content).toContain('## aria-roles (critical)');
  });

  it('contains a summary table', async () => {
    const filePath = await writeMarkdown(sampleReport, 'test-md-table', REPORTS_DIR);
    const content = await readFile(filePath, 'utf-8');

    expect(content).toContain('| Violation Type | Impact | Patterns | Affected Pages |');
    expect(content).toContain('|---|---|---|---|');
    expect(content).toContain('color-contrast');
    expect(content).toContain('aria-roles');
  });

  it('wraps affected URLs in collapsible details block', async () => {
    const filePath = await writeMarkdown(sampleReport, 'test-md-details', REPORTS_DIR);
    const content = await readFile(filePath, 'utf-8');

    expect(content).toContain('<details><summary>Affected URLs (3)</summary>');
    expect(content).toContain('</details>');
    expect(content).toContain('- https://example.com/a');
  });

  it('escapes HTML snippets in backticks', async () => {
    const xssReport: JsonReport = {
      ...sampleReport,
      patterns: [
        {
          ...sampleReport.patterns[0],
          htmlSnippet: '<script>alert("xss")</script>',
        },
      ],
    };

    const filePath = await writeMarkdown(xssReport, 'test-md-escape', REPORTS_DIR);
    const content = await readFile(filePath, 'utf-8');

    // The raw <script> tag should not appear unescaped
    expect(content).not.toContain('- **HTML snippet:** `<script>');
    // It should be escaped
    expect(content).toContain('&lt;script&gt;');
  });
});
