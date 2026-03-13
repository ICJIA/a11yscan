import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { writeHTML } from './html.js';
import { readFile, rm, mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { JsonReport } from './json.js';

let REPORTS_DIR: string;

beforeAll(async () => {
  REPORTS_DIR = await mkdtemp(join(tmpdir(), 'a11yscan-test-html-'));
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

describe('writeHTML', () => {
  it('creates an HTML file', async () => {
    const filePath = await writeHTML(sampleReport, 'test-html-output', REPORTS_DIR);
    expect(filePath).toMatch(/\.html$/);

    const content = await readFile(filePath, 'utf-8');
    expect(content.length).toBeGreaterThan(0);
  });

  it('contains proper HTML structure (DOCTYPE, html, head, body)', async () => {
    const filePath = await writeHTML(sampleReport, 'test-html-structure', REPORTS_DIR);
    const content = await readFile(filePath, 'utf-8');

    expect(content).toContain('<!DOCTYPE html>');
    expect(content).toContain('<html lang="en">');
    expect(content).toContain('<head>');
    expect(content).toContain('<body>');
    expect(content).toContain('</html>');
  });

  it('groups patterns by violation type (group-header class)', async () => {
    const filePath = await writeHTML(sampleReport, 'test-html-groups', REPORTS_DIR);
    const content = await readFile(filePath, 'utf-8');

    // Should have group-header elements for each violation type
    expect(content).toContain('class="group-header"');
    expect(content).toContain('color-contrast');
    expect(content).toContain('aria-roles');
  });

  it('renders impact badges with correct colors (critical = #d32f2f)', async () => {
    const filePath = await writeHTML(sampleReport, 'test-html-badges', REPORTS_DIR);
    const content = await readFile(filePath, 'utf-8');

    expect(content).toContain('background:#d32f2f');
    expect(content).toContain('background:#e65100');
  });

  it('shows affected URLs in expandable details elements', async () => {
    const filePath = await writeHTML(sampleReport, 'test-html-details', REPORTS_DIR);
    const content = await readFile(filePath, 'utf-8');

    expect(content).toContain('<details>');
    expect(content).toContain('</details>');
    expect(content).toContain('https://example.com/a');
  });

  it('escapes htmlSnippet properly (no raw HTML injection)', async () => {
    const xssReport: JsonReport = {
      ...sampleReport,
      patterns: [
        {
          ...sampleReport.patterns[0],
          htmlSnippet: '<script>alert("xss")</script>',
        },
      ],
    };

    const filePath = await writeHTML(xssReport, 'test-html-escape', REPORTS_DIR);
    const content = await readFile(filePath, 'utf-8');

    expect(content).not.toContain('<script>alert("xss")</script>');
    expect(content).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });

  it('shows "No accessibility violations found" when patterns array is empty', async () => {
    const emptyReport: JsonReport = {
      ...sampleReport,
      patterns: [],
    };

    const filePath = await writeHTML(emptyReport, 'test-html-empty', REPORTS_DIR);
    const content = await readFile(filePath, 'utf-8');

    expect(content).toContain('No accessibility violations found');
  });

  it('auto-creates reports directory', async () => {
    await rm(REPORTS_DIR, { recursive: true, force: true }).catch(() => {});

    const filePath = await writeHTML(sampleReport, 'test-html-autodir', REPORTS_DIR);
    expect(filePath).toContain('test-html-autodir.html');

    const content = await readFile(filePath, 'utf-8');
    expect(content.length).toBeGreaterThan(0);
  });
});
