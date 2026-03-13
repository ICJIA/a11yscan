/**
 * HTML report writer — self-contained, human-readable accessibility report.
 * Patterns are grouped by violation type (e.g., all color-contrast patterns
 * under one heading, all aria-roles under another).
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { JsonReport } from './json.js';
import type { ViolationPattern } from '../analyzer/patterns.js';
import { AXE_RULES } from '../scanner/axe.js';

const REPORTS_DIR = resolve(process.cwd(), 'reports');

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function impactBadge(impact: string): string {
  const colors: Record<string, string> = {
    critical: '#d32f2f',
    serious: '#e65100',
    moderate: '#f9a825',
    minor: '#558b2f',
  };
  const bg = colors[impact] || '#757575';
  return `<span style="background:${bg};color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600;text-transform:uppercase;">${escapeHtml(impact)}</span>`;
}

/** Group patterns by violationId, preserving order of first appearance. */
function groupByViolation(
  patterns: ViolationPattern[]
): Map<string, { description: string; impact: string; fixUrl: string; patterns: ViolationPattern[] }> {
  const groups = new Map<
    string,
    { description: string; impact: string; fixUrl: string; patterns: ViolationPattern[] }
  >();

  for (const p of patterns) {
    if (!groups.has(p.violationId)) {
      groups.set(p.violationId, {
        description: p.violationDescription,
        impact: p.impact,
        fixUrl: p.suggestedFix,
        patterns: [],
      });
    }
    groups.get(p.violationId)!.patterns.push(p);
  }

  return groups;
}

function buildPatternRow(p: ViolationPattern): string {
  return `
    <tr>
      <td><code>${escapeHtml(p.patternId)}</code></td>
      <td>${impactBadge(p.impact)}</td>
      <td><code style="font-size:12px;">${escapeHtml(p.normalizedSelector)}</code></td>
      <td style="text-align:center;font-weight:600;">${p.affectedPageCount}</td>
      <td><span style="color:#555;font-size:13px;">${escapeHtml(p.rootCauseHint)}</span></td>
      <td>${p.htmlSnippet ? `<pre style="margin:0;font-size:11px;max-width:320px;overflow-x:auto;background:#f5f5f5;padding:4px 6px;border-radius:3px;white-space:pre-wrap;word-break:break-all;">${escapeHtml(p.htmlSnippet)}</pre>` : '<span style="color:#999;">&mdash;</span>'}</td>
      <td>
        <details><summary style="cursor:pointer;font-size:12px;">${p.affectedUrls.length} URL${p.affectedUrls.length !== 1 ? 's' : ''}</summary>
        <ul style="margin:4px 0;padding-left:16px;font-size:11px;">
          ${p.affectedUrls.map((u) => `<li><a href="${escapeHtml(u)}" target="_blank" rel="noopener">${escapeHtml(u)}</a></li>`).join('\n          ')}
        </ul>
        </details>
      </td>
    </tr>`;
}

function buildGroupSection(
  violationId: string,
  group: { description: string; impact: string; fixUrl: string; patterns: ViolationPattern[] }
): string {
  const totalPages = new Set(group.patterns.flatMap((p) => p.affectedUrls)).size;

  return `
  <div class="group">
    <div class="group-header">
      <div class="group-title">
        <h3>${escapeHtml(violationId)}</h3>
        ${impactBadge(group.impact)}
        <span class="group-stats">${group.patterns.length} pattern${group.patterns.length !== 1 ? 's' : ''} across ${totalPages} page${totalPages !== 1 ? 's' : ''}</span>
      </div>
      <p class="group-desc">${escapeHtml(group.description)}</p>
      <a href="${escapeHtml(group.fixUrl)}" target="_blank" rel="noopener" style="font-size:12px;">Fix guide &rarr;</a>
    </div>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Impact</th>
          <th>Selector</th>
          <th>Pages</th>
          <th>Root Cause</th>
          <th>HTML Snippet</th>
          <th>Affected URLs</th>
        </tr>
      </thead>
      <tbody>${group.patterns.map(buildPatternRow).join('\n')}
      </tbody>
    </table>
  </div>`;
}

/** Rule categories for the reference section at the bottom of the report. */
const RULE_CATEGORIES: { name: string; rules: { id: string; desc: string }[] }[] = [
  {
    name: 'ARIA Roles & Attributes',
    rules: [
      { id: 'aria-allowed-attr', desc: 'ARIA attributes must be allowed for the role' },
      { id: 'aria-allowed-role', desc: 'ARIA role must be appropriate for the element' },
      { id: 'aria-braille-equivalent', desc: 'ARIA braille attributes must have non-braille equivalent' },
      { id: 'aria-command-name', desc: 'ARIA command roles must have an accessible name' },
      { id: 'aria-conditional-attr', desc: 'ARIA attributes used conditionally must be valid' },
      { id: 'aria-deprecated-role', desc: 'Deprecated ARIA roles must not be used' },
      { id: 'aria-dialog-name', desc: 'Dialog elements must have an accessible name' },
      { id: 'aria-hidden-body', desc: 'aria-hidden must not be present on the document body' },
      { id: 'aria-hidden-focus', desc: 'aria-hidden elements must not be focusable' },
      { id: 'aria-input-field-name', desc: 'ARIA input fields must have an accessible name' },
      { id: 'aria-meter-name', desc: 'ARIA meter elements must have an accessible name' },
      { id: 'aria-progressbar-name', desc: 'ARIA progressbar must have an accessible name' },
      { id: 'aria-prohibited-attr', desc: 'ARIA attributes must not be prohibited for the role' },
      { id: 'aria-required-attr', desc: 'Required ARIA attributes must be provided' },
      { id: 'aria-required-children', desc: 'ARIA roles must contain their required children' },
      { id: 'aria-required-parent', desc: 'ARIA roles must be contained by required parent' },
      { id: 'aria-roledescription', desc: 'aria-roledescription must be on semantic role elements' },
      { id: 'aria-roles', desc: 'ARIA role attribute must have a valid value' },
      { id: 'aria-text', desc: 'role=text must not contain focusable content' },
      { id: 'aria-toggle-field-name', desc: 'ARIA toggle fields must have an accessible name' },
      { id: 'aria-tooltip-name', desc: 'ARIA tooltip elements must have an accessible name' },
      { id: 'aria-treeitem-name', desc: 'ARIA treeitem must have an accessible name' },
      { id: 'aria-valid-attr', desc: 'ARIA attributes must be valid and not misspelled' },
      { id: 'aria-valid-attr-value', desc: 'ARIA attribute values must be valid' },
    ],
  },
  {
    name: 'Accessible Names & Labels',
    rules: [
      { id: 'area-alt', desc: 'Image map area elements must have alt text' },
      { id: 'button-name', desc: 'Buttons must have discernible text' },
      { id: 'empty-heading', desc: 'Headings must not be empty' },
      { id: 'empty-table-header', desc: 'Table headers must not be empty' },
      { id: 'frame-title', desc: 'Frames must have an accessible name' },
      { id: 'frame-title-unique', desc: 'Frame titles must be unique' },
      { id: 'image-alt', desc: 'Images must have alt text' },
      { id: 'image-redundant-alt', desc: 'Alt text must not duplicate surrounding text' },
      { id: 'input-button-name', desc: 'Input buttons must have discernible text' },
      { id: 'input-image-alt', desc: 'Image inputs must have alt text' },
      { id: 'label', desc: 'Form elements must have labels' },
      { id: 'label-content-name-mismatch', desc: 'Label text must match the accessible name' },
      { id: 'label-title-only', desc: 'Form fields should not use title as only label' },
      { id: 'link-name', desc: 'Links must have discernible text' },
      { id: 'object-alt', desc: 'Object elements must have alt text' },
      { id: 'role-img-alt', desc: 'role=img elements must have alt text' },
      { id: 'select-name', desc: 'Select elements must have an accessible name' },
      { id: 'summary-name', desc: 'Summary elements must have discernible text' },
      { id: 'svg-img-alt', desc: 'SVG images must have an accessible name' },
    ],
  },
  {
    name: 'Color Contrast',
    rules: [
      { id: 'color-contrast', desc: 'Text must meet WCAG AA contrast ratios (4.5:1 normal, 3:1 large)' },
      { id: 'link-in-text-block', desc: 'Links in text blocks must be visually distinguishable' },
    ],
  },
  {
    name: 'Document Structure',
    rules: [
      { id: 'bypass', desc: 'Page must have a way to bypass repeated content' },
      { id: 'document-title', desc: 'Document must have a title element' },
      { id: 'duplicate-id-aria', desc: 'IDs used in ARIA must be unique' },
      { id: 'heading-order', desc: 'Heading levels should only increase by one' },
      { id: 'html-has-lang', desc: 'HTML element must have a lang attribute' },
      { id: 'html-lang-valid', desc: 'lang attribute must have a valid value' },
      { id: 'html-xml-lang-mismatch', desc: 'xml:lang and lang must match' },
      { id: 'p-as-heading', desc: 'Styled paragraphs must not be used as headings' },
      { id: 'page-has-heading-one', desc: 'Page should contain a level-one heading' },
      { id: 'valid-lang', desc: 'lang attributes must use valid BCP 47 values' },
    ],
  },
  {
    name: 'Landmarks & Regions',
    rules: [
      { id: 'landmark-banner-is-top-level', desc: 'Banner landmark must be top level' },
      { id: 'landmark-complementary-is-top-level', desc: 'Complementary landmark must be top level' },
      { id: 'landmark-contentinfo-is-top-level', desc: 'Contentinfo landmark must be top level' },
      { id: 'landmark-main-is-top-level', desc: 'Main landmark must be top level' },
      { id: 'landmark-no-duplicate-banner', desc: 'Page must not have more than one banner' },
      { id: 'landmark-no-duplicate-contentinfo', desc: 'Page must not have more than one contentinfo' },
      { id: 'landmark-no-duplicate-main', desc: 'Page must not have more than one main landmark' },
      { id: 'landmark-one-main', desc: 'Page must have exactly one main landmark' },
      { id: 'landmark-unique', desc: 'Landmarks must have unique accessible names' },
      { id: 'region', desc: 'All page content must be within landmark regions' },
      { id: 'skip-link', desc: 'Page should have a valid skip link' },
    ],
  },
  {
    name: 'Lists',
    rules: [
      { id: 'definition-list', desc: 'dl elements must be properly structured' },
      { id: 'dlitem', desc: 'dt/dd must be within a dl' },
      { id: 'list', desc: 'li must be within ul or ol' },
      { id: 'listitem', desc: 'List items must be in a list container' },
    ],
  },
  {
    name: 'Tables',
    rules: [
      { id: 'scope-attr-valid', desc: 'Scope attribute must have a valid value' },
      { id: 'table-duplicate-name', desc: 'Tables should not have duplicate accessible names' },
      { id: 'table-fake-caption', desc: 'Tables must use proper caption element' },
      { id: 'td-has-header', desc: 'Data cells in tables must have headers' },
      { id: 'td-headers-attr', desc: 'headers attribute must refer to valid cells' },
      { id: 'th-has-data-cells', desc: 'Table headers must have associated data cells' },
    ],
  },
  {
    name: 'Forms & Inputs',
    rules: [
      { id: 'accesskeys', desc: 'accesskey values should be unique' },
      { id: 'autocomplete-valid', desc: 'autocomplete attribute must be correct' },
      { id: 'form-field-multiple-labels', desc: 'Form fields must not have multiple labels' },
      { id: 'tabindex', desc: 'tabindex should not be greater than 0' },
    ],
  },
  {
    name: 'Interactive Elements',
    rules: [
      { id: 'frame-focusable-content', desc: 'Frames with focusable content must have tabindex' },
      { id: 'nested-interactive', desc: 'Interactive elements must not be nested' },
      { id: 'presentation-role-conflict', desc: 'Presentation role must not conflict with native semantics' },
      { id: 'scrollable-region-focusable', desc: 'Scrollable regions must be keyboard accessible' },
    ],
  },
  {
    name: 'Media',
    rules: [
      { id: 'audio-caption', desc: 'Audio elements must have captions' },
      { id: 'no-autoplay-audio', desc: 'Audio must not autoplay for more than 3 seconds' },
      { id: 'video-caption', desc: 'Video elements must have captions' },
    ],
  },
  {
    name: 'Visual & Layout',
    rules: [
      { id: 'avoid-inline-spacing', desc: 'Inline text spacing must be adjustable' },
      { id: 'blink', desc: 'Blink elements must not be used' },
      { id: 'css-orientation-lock', desc: 'CSS must not lock display orientation' },
      { id: 'marquee', desc: 'Marquee elements must not be used' },
      { id: 'meta-refresh', desc: 'Timed meta refresh must not be used' },
      { id: 'meta-viewport', desc: 'Viewport must not disable user zoom' },
      { id: 'meta-viewport-large', desc: 'Viewport must allow sufficient magnification' },
      { id: 'server-side-image-map', desc: 'Server-side image maps must not be used' },
      { id: 'target-size', desc: 'Touch targets must be at least 24×24 CSS pixels' },
    ],
  },
];

function buildRuleReference(): string {
  const totalRules = RULE_CATEGORIES.reduce((sum, cat) => sum + cat.rules.length, 0);

  const categoryRows = RULE_CATEGORIES.map((cat) => {
    const ruleRows = cat.rules
      .map(
        (r) =>
          `<tr><td style="font-family:monospace;font-size:12px;white-space:nowrap;padding:4px 12px;"><a href="https://dequeuniversity.com/rules/axe/4.x/${r.id}" target="_blank" rel="noopener">${escapeHtml(r.id)}</a></td><td style="font-size:12px;padding:4px 12px;color:#555;">${escapeHtml(r.desc)}</td></tr>`
      )
      .join('\n            ');

    return `
        <tr><td colspan="2" style="padding:12px 12px 4px;font-weight:700;font-size:13px;background:#f8f8f8;border-top:1px solid #e0e0e0;">${escapeHtml(cat.name)} <span style="font-weight:400;color:#999;">(${cat.rules.length})</span></td></tr>
            ${ruleRows}`;
  }).join('\n');

  return `
  <div style="margin-top:48px;border-top:2px solid #e0e0e0;padding-top:24px;">
    <h2 style="font-size:16px;margin:0 0 8px;">axe-core Rule Reference (${totalRules} rules)</h2>
    <p style="font-size:13px;color:#555;margin:0 0 16px;">
      This scan checks <strong>${totalRules} rules</strong> — the most thorough assessment possible with open-source
      <a href="https://github.com/dequelabs/axe-core" target="_blank" rel="noopener">axe-core</a>.
      Covers all WCAG 2.1 AA requirements plus best-practice rules for landmarks, headings, and semantics.
      Rules marked with <em>best-practice</em> go beyond WCAG but reflect widely accepted accessibility standards.
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      ${categoryRows}
    </table>
  </div>`;
}

function buildHtml(report: JsonReport): string {
  const { meta, patterns, skippedUrls } = report;
  const criticalCount = patterns.filter((p) => p.impact === 'critical').length;
  const seriousCount = patterns.filter((p) => p.impact === 'serious').length;
  const groups = groupByViolation(patterns);

  const groupSections = Array.from(groups.entries())
    .map(([violationId, group]) => buildGroupSection(violationId, group))
    .join('\n');

  const skippedSection =
    skippedUrls.length > 0
      ? `
    <h2>Skipped URLs (${skippedUrls.length})</h2>
    <table>
      <thead><tr><th>URL</th><th>Reason</th></tr></thead>
      <tbody>
        ${skippedUrls.map((s) => `<tr><td>${escapeHtml(s.url)}</td><td>${escapeHtml(s.reason)}</td></tr>`).join('\n        ')}
      </tbody>
    </table>`
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>a11yscan Report — ${escapeHtml(meta.sitemap)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 24px; background: #fafafa; color: #222; line-height: 1.5; }
    h1 { font-size: 22px; margin: 0 0 4px; }
    h2 { font-size: 18px; margin: 32px 0 12px; border-bottom: 2px solid #e0e0e0; padding-bottom: 6px; }
    .meta { background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
    .meta-item { font-size: 13px; }
    .meta-item strong { display: block; font-size: 22px; color: #111; }
    .meta-item.critical strong { color: #d32f2f; }
    .meta-item.serious strong { color: #e65100; }
    .group { margin-bottom: 28px; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; background: #fff; }
    .group-header { padding: 16px 20px; background: #f8f8f8; border-bottom: 1px solid #e0e0e0; }
    .group-title { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .group-title h3 { margin: 0; font-size: 16px; font-family: monospace; }
    .group-stats { font-size: 13px; color: #777; }
    .group-desc { margin: 6px 0 4px; font-size: 13px; color: #555; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    thead { background: #f5f5f5; }
    th { text-align: left; padding: 10px 12px; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #555; border-bottom: 2px solid #e0e0e0; }
    td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
    tr:last-child td { border-bottom: none; }
    tr:hover { background: #fafafa; }
    a { color: #1565c0; text-decoration: none; }
    a:hover { text-decoration: underline; }
    code { background: #f0f0f0; padding: 1px 5px; border-radius: 3px; font-size: 13px; }
    .footer { margin-top: 32px; font-size: 12px; color: #999; }
    ${meta.interrupted ? '.interrupted { background: #fff3e0; border: 1px solid #ffb74d; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; color: #e65100; }' : ''}
  </style>
</head>
<body>
  <h1>a11yscan Report</h1>
  <p style="color:#555;margin:0 0 16px;font-size:14px;">
    ${escapeHtml(meta.sitemap)}${meta.filter ? ` &mdash; filter: <code>${escapeHtml(meta.filter)}</code>` : ''}
  </p>

  ${meta.interrupted ? `<div class="interrupted">Scan was interrupted: ${escapeHtml(meta.interruptReason || 'unknown reason')}. Results below are partial.</div>` : ''}

  <div class="meta">
    <div class="meta-item"><strong>${meta.pagesScanned}</strong>Pages scanned</div>
    <div class="meta-item"><strong>${meta.pagesSkipped}</strong>Pages skipped</div>
    <div class="meta-item"><strong>${meta.totalViolations}</strong>Total violations</div>
    <div class="meta-item"><strong>${meta.totalPatterns}</strong>Unique patterns</div>
    <div class="meta-item critical"><strong>${criticalCount}</strong>Critical</div>
    <div class="meta-item serious"><strong>${seriousCount}</strong>Serious</div>
  </div>

  <h2>Violations by Type (${groups.size})</h2>
  ${patterns.length > 0 ? groupSections : '<p style="color:#558b2f;font-weight:600;">No accessibility violations found.</p>'}

  ${skippedSection}

  ${buildRuleReference()}

  <div class="footer">
    Generated by ${escapeHtml(meta.tool)} v${escapeHtml(meta.version)} on ${escapeHtml(meta.generatedAt)}
  </div>
</body>
</html>`;
}

/**
 * Write an HTML report to disk.
 *
 * @returns The absolute path to the written HTML file.
 */
export async function writeHTML(
  report: JsonReport,
  filename: string,
  siteReportsDir?: string
): Promise<string> {
  const dir = siteReportsDir || REPORTS_DIR;
  await mkdir(dir, { recursive: true });

  const filePath = join(dir, `${filename}.html`);
  await writeFile(filePath, buildHtml(report), 'utf-8');
  return filePath;
}
