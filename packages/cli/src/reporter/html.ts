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

const IMPACT_COLORS: Record<string, string> = {
  critical: '#d32f2f',
  serious: '#e65100',
  moderate: '#f9a825',
  minor: '#558b2f',
};

const IMPACT_ORDER: Record<string, number> = { critical: 0, serious: 1, moderate: 2, minor: 3 };

function impactBadge(impact: string): string {
  const bg = IMPACT_COLORS[impact] || '#757575';
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
      <td><span style="font-size:12px;color:#555;">${escapeHtml(p.failureSummary)}</span></td>
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
  group: { description: string; impact: string; fixUrl: string; patterns: ViolationPattern[] },
  index: number
): string {
  const totalPages = new Set(group.patterns.flatMap((p) => p.affectedUrls)).size;
  const borderColor = IMPACT_COLORS[group.impact] || '#757575';
  const isHighSeverity = group.impact === 'critical' || group.impact === 'serious';

  return `
  <details class="group" id="group-${index}"${isHighSeverity ? ' open' : ''}>
    <summary class="group-header" style="border-left:4px solid ${borderColor};">
      <div class="group-title">
        <h3>${escapeHtml(violationId)}</h3>
        ${impactBadge(group.impact)}
        <span class="group-stats">${group.patterns.length} pattern${group.patterns.length !== 1 ? 's' : ''} &middot; ${totalPages} page${totalPages !== 1 ? 's' : ''}</span>
      </div>
      <p class="group-desc">${escapeHtml(group.description)}</p>
    </summary>
    <div class="group-body">
      <div style="padding:8px 20px 4px;font-size:12px;">
        <a href="${escapeHtml(group.fixUrl)}" target="_blank" rel="noopener" style="color:#1565c0;">Fix guide &rarr;</a>
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
            <th>Failure Summary</th>
            <th>Affected URLs</th>
          </tr>
        </thead>
        <tbody>${group.patterns.map(buildPatternRow).join('\n')}
        </tbody>
      </table>
    </div>
  </details>`;
}

/** Build a jump-nav table of contents for the violation groups. */
function buildToc(
  sortedGroups: [string, { description: string; impact: string; fixUrl: string; patterns: ViolationPattern[] }][]
): string {
  if (sortedGroups.length === 0) return '';

  const items = sortedGroups
    .map(([violationId, group], i) => {
      const totalPages = new Set(group.patterns.flatMap((p) => p.affectedUrls)).size;
      const dotColor = IMPACT_COLORS[group.impact] || '#757575';
      return `<a href="#group-${i}" class="toc-item" onclick="document.getElementById('group-${i}').open=true">
        <span class="toc-dot" style="background:${dotColor};"></span>
        <span class="toc-rule">${escapeHtml(violationId)}</span>
        <span class="toc-count">${group.patterns.length}p &middot; ${totalPages}pg</span>
      </a>`;
    })
    .join('\n      ');

  return `
  <div class="toc">
    <div class="toc-label">Jump to violation:</div>
    <div class="toc-items">
      ${items}
    </div>
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
      { id: 'target-size', desc: 'Touch targets must be at least 24x24 CSS pixels' },
    ],
  },
];

function buildRuleReference(): string {
  const totalRules = RULE_CATEGORIES.reduce((sum, cat) => sum + cat.rules.length, 0);

  const categoryRows = RULE_CATEGORIES.map((cat) => {
    const ruleRows = cat.rules
      .map(
        (r) =>
          `<tr><td style="font-family:monospace;font-size:12px;white-space:nowrap;padding:4px 12px;"><a href="https://dequeuniversity.com/rules/axe/4.10/${r.id}" target="_blank" rel="noopener">${escapeHtml(r.id)}</a></td><td style="font-size:12px;padding:4px 12px;color:#555;">${escapeHtml(r.desc)}</td></tr>`
      )
      .join('\n            ');

    return `
        <tr><td colspan="2" style="padding:12px 12px 4px;font-weight:700;font-size:13px;background:#f8f8f8;border-top:1px solid #e0e0e0;">${escapeHtml(cat.name)} <span style="font-weight:400;color:#999;">(${cat.rules.length})</span></td></tr>
            ${ruleRows}`;
  }).join('\n');

  return `
  <details class="rule-ref">
    <summary class="rule-ref-header">
      <h2 style="display:inline;font-size:16px;margin:0;border:none;padding:0;">axe-core Rule Reference (${totalRules} rules)</h2>
    </summary>
    <div style="padding:16px 20px;">
      <p style="font-size:13px;color:#555;margin:0 0 16px;">
        This scan checks <strong>${totalRules} rules</strong> — the most thorough assessment possible with open-source
        <a href="https://github.com/dequelabs/axe-core" target="_blank" rel="noopener">axe-core</a>.
        Covers all WCAG 2.1 AA requirements plus best-practice rules for landmarks, headings, and semantics.
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        ${categoryRows}
      </table>
    </div>
  </details>`;
}

function buildHtml(report: JsonReport, filename: string): string {
  const { meta, patterns, skippedUrls } = report;
  const criticalCount = patterns.filter((p) => p.impact === 'critical').length;
  const seriousCount = patterns.filter((p) => p.impact === 'serious').length;
  const moderateCount = patterns.filter((p) => p.impact === 'moderate').length;
  const minorCount = patterns.filter((p) => p.impact === 'minor').length;
  const groups = groupByViolation(patterns);

  const sortedGroups = Array.from(groups.entries())
    .sort(([, a], [, b]) => (IMPACT_ORDER[a.impact] ?? 4) - (IMPACT_ORDER[b.impact] ?? 4));

  const groupSections = sortedGroups
    .map(([violationId, group], i) => buildGroupSection(violationId, group, i))
    .join('\n');

  const toc = buildToc(sortedGroups);

  const skippedSection =
    skippedUrls.length > 0
      ? `
    <details class="rule-ref" style="margin-top:24px;">
      <summary class="rule-ref-header">
        <h2 style="display:inline;font-size:16px;margin:0;border:none;padding:0;">Skipped URLs (${skippedUrls.length})</h2>
      </summary>
      <div style="padding:0;">
        <table>
          <thead><tr><th>URL</th><th>Reason</th></tr></thead>
          <tbody>
            ${skippedUrls.map((s) => `<tr><td>${escapeHtml(s.url)}</td><td>${escapeHtml(s.reason)}</td></tr>`).join('\n            ')}
          </tbody>
        </table>
      </div>
    </details>`
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>a11yscan Report — ${escapeHtml(meta.sitemap)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 24px; background: #f5f5f5; color: #222; line-height: 1.5; max-width: 1400px; margin: 0 auto; }

    /* Header */
    .report-header { background: #fff; border: 1px solid #e0e0e0; border-radius: 12px; padding: 24px 28px; margin-bottom: 20px; }
    .report-header h1 { font-size: 24px; margin: 0 0 2px; color: #111; }
    .report-header .subtitle { color: #555; margin: 0 0 16px; font-size: 14px; }

    /* Summary cards */
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; }
    .summary-card { background: #f8f8f8; border-radius: 8px; padding: 12px 16px; text-align: center; }
    .summary-card .number { display: block; font-size: 28px; font-weight: 700; color: #111; }
    .summary-card .label { font-size: 12px; color: #777; text-transform: uppercase; letter-spacing: 0.5px; }
    .summary-card.critical { background: #fde8e8; }
    .summary-card.critical .number { color: #d32f2f; }
    .summary-card.serious { background: #fff3e0; }
    .summary-card.serious .number { color: #e65100; }
    .summary-card.moderate { background: #fffde7; }
    .summary-card.moderate .number { color: #f9a825; }
    .summary-card.minor { background: #e8f5e9; }
    .summary-card.minor .number { color: #558b2f; }

    /* Table of contents */
    .toc { background: #fff; border: 1px solid #e0e0e0; border-radius: 12px; padding: 16px 20px; margin-bottom: 20px; }
    .toc-label { font-size: 12px; font-weight: 600; text-transform: uppercase; color: #999; letter-spacing: 0.5px; margin-bottom: 8px; }
    .toc-items { display: flex; flex-wrap: wrap; gap: 6px; }
    .toc-item { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 6px; font-size: 13px; text-decoration: none; color: #333; background: #f5f5f5; border: 1px solid #e0e0e0; transition: background 0.15s; }
    .toc-item:hover { background: #e8e8e8; text-decoration: none; }
    .toc-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .toc-rule { font-family: monospace; font-size: 12px; }
    .toc-count { font-size: 11px; color: #999; }

    /* Section heading */
    .section-heading { font-size: 18px; margin: 28px 0 12px; padding-bottom: 6px; border-bottom: 2px solid #e0e0e0; color: #333; }

    /* Violation groups — collapsible */
    .group { margin-bottom: 12px; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden; background: #fff; }
    .group[open] { margin-bottom: 16px; }
    .group-header { padding: 14px 20px; background: #fafafa; cursor: pointer; list-style: none; user-select: none; }
    .group-header::-webkit-details-marker { display: none; }
    .group-header::marker { display: none; content: ''; }
    .group-title { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .group-title h3 { margin: 0; font-size: 15px; font-family: monospace; }
    .group-title::before { content: '\\25B6'; font-size: 10px; color: #999; transition: transform 0.2s; flex-shrink: 0; }
    .group[open] > .group-header .group-title::before { transform: rotate(90deg); }
    .group-stats { font-size: 13px; color: #777; margin-left: auto; }
    .group-desc { margin: 4px 0 0 22px; font-size: 13px; color: #666; }
    .group-body { border-top: 1px solid #e8e8e8; }

    /* Tables */
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead { background: #f5f5f5; }
    th { text-align: left; padding: 8px 12px; font-weight: 600; font-size: 11px; text-transform: uppercase; color: #888; border-bottom: 2px solid #e0e0e0; letter-spacing: 0.3px; }
    td { padding: 8px 12px; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
    tr:last-child td { border-bottom: none; }
    tr:hover { background: #fafafa; }

    /* Links & code */
    a { color: #1565c0; text-decoration: none; }
    a:hover { text-decoration: underline; }
    code { background: #f0f0f0; padding: 1px 5px; border-radius: 3px; font-size: 12px; }

    /* LLM-ready section */
    .llm-section { margin-top: 24px; border: 2px solid #0097a7; border-radius: 12px; overflow: hidden; background: #fff; }
    .llm-header { background: #0097a7; padding: 12px 20px; }
    .llm-header h2 { margin: 0; font-size: 16px; color: #fff; border: none; padding: 0; }
    .llm-body { padding: 16px 20px; }

    /* Rule reference section */
    .rule-ref { margin-top: 24px; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; background: #fff; }
    .rule-ref-header { padding: 14px 20px; background: #fafafa; cursor: pointer; list-style: none; user-select: none; }
    .rule-ref-header::-webkit-details-marker { display: none; }
    .rule-ref-header::marker { display: none; content: ''; }

    /* Footer */
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #999; text-align: center; }

    ${meta.interrupted ? '.interrupted { background: #fff3e0; border: 1px solid #ffb74d; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; color: #e65100; }' : ''}
  </style>
</head>
<body>
  ${meta.interrupted ? `<div class="interrupted">Scan was interrupted: ${escapeHtml(meta.interruptReason || 'unknown reason')}. Results below are partial.</div>` : ''}

  <div class="report-header">
    <h1>a11yscan Report</h1>
    <p class="subtitle">
      ${escapeHtml(meta.sitemap)}${meta.filter ? ` &mdash; filter: <code>${escapeHtml(meta.filter)}</code>` : ''}
    </p>
    <div class="summary">
      <div class="summary-card"><span class="number">${meta.pagesScanned}</span><span class="label">Pages scanned</span></div>
      <div class="summary-card"><span class="number">${meta.pagesSkipped}</span><span class="label">Skipped</span></div>
      <div class="summary-card"><span class="number">${meta.totalPatterns}</span><span class="label">Patterns</span></div>
      <div class="summary-card critical"><span class="number">${criticalCount}</span><span class="label">Critical</span></div>
      <div class="summary-card serious"><span class="number">${seriousCount}</span><span class="label">Serious</span></div>
      <div class="summary-card moderate"><span class="number">${moderateCount}</span><span class="label">Moderate</span></div>
      <div class="summary-card minor"><span class="number">${minorCount}</span><span class="label">Minor</span></div>
    </div>
  </div>

  ${toc}

  <h2 class="section-heading">Violations by Type (${groups.size})</h2>
  ${patterns.length > 0 ? groupSections : '<p style="color:#558b2f;font-weight:600;">No accessibility violations found.</p>'}

  ${skippedSection}

  <div class="llm-section">
    <div class="llm-header">
      <h2>LLM-Ready Report</h2>
    </div>
    <div class="llm-body">
      <p style="margin:0 0 12px;font-size:13px;color:#555;">
        Feed the JSON report to Claude, GPT, or any code-generation LLM to get actionable fix suggestions.
        The JSON includes every field needed for automated remediation: <code>htmlSnippet</code>, <code>failureSummary</code>,
        <code>rawSelector</code>, <code>normalizedSelector</code>, <code>suggestedFix</code>, <code>rootCauseHint</code>,
        and affected URLs.
      </p>
      <div style="display:flex;gap:12px;flex-wrap:wrap;">
        <a href="./${escapeHtml(filename)}.json" download style="display:inline-flex;align-items:center;gap:6px;background:#0097a7;color:#fff;padding:8px 16px;border-radius:6px;font-size:13px;font-weight:600;text-decoration:none;">
          &#x2B07; Download JSON for LLM
        </a>
        <a href="./${escapeHtml(filename)}.csv" download style="display:inline-flex;align-items:center;gap:6px;background:#555;color:#fff;padding:8px 16px;border-radius:6px;font-size:13px;font-weight:600;text-decoration:none;">
          &#x2B07; Download CSV
        </a>
      </div>
      <details style="margin-top:12px;">
        <summary style="cursor:pointer;font-size:12px;color:#0097a7;font-weight:600;">What each JSON field means</summary>
        <table style="margin-top:8px;font-size:12px;border-collapse:collapse;width:100%;">
          <tr><td style="padding:3px 8px;font-family:monospace;white-space:nowrap;color:#0097a7;">patternId</td><td style="padding:3px 8px;color:#555;">Unique pattern identifier (e.g., P001)</td></tr>
          <tr><td style="padding:3px 8px;font-family:monospace;white-space:nowrap;color:#0097a7;">violationId</td><td style="padding:3px 8px;color:#555;">axe-core rule ID (e.g., color-contrast)</td></tr>
          <tr><td style="padding:3px 8px;font-family:monospace;white-space:nowrap;color:#0097a7;">impact</td><td style="padding:3px 8px;color:#555;">Severity: critical, serious, moderate, minor</td></tr>
          <tr><td style="padding:3px 8px;font-family:monospace;white-space:nowrap;color:#0097a7;">htmlSnippet</td><td style="padding:3px 8px;color:#555;">Exact DOM element markup that failed</td></tr>
          <tr><td style="padding:3px 8px;font-family:monospace;white-space:nowrap;color:#0097a7;">failureSummary</td><td style="padding:3px 8px;color:#555;">Plain-English fix instructions from axe-core</td></tr>
          <tr><td style="padding:3px 8px;font-family:monospace;white-space:nowrap;color:#0097a7;">rawSelector</td><td style="padding:3px 8px;color:#555;">Full CSS selector path to the element</td></tr>
          <tr><td style="padding:3px 8px;font-family:monospace;white-space:nowrap;color:#0097a7;">normalizedSelector</td><td style="padding:3px 8px;color:#555;">Cleaned selector for pattern grouping</td></tr>
          <tr><td style="padding:3px 8px;font-family:monospace;white-space:nowrap;color:#0097a7;">suggestedFix</td><td style="padding:3px 8px;color:#555;">Link to Deque University fix guide</td></tr>
          <tr><td style="padding:3px 8px;font-family:monospace;white-space:nowrap;color:#0097a7;">rootCauseHint</td><td style="padding:3px 8px;color:#555;">Framework component likely responsible</td></tr>
          <tr><td style="padding:3px 8px;font-family:monospace;white-space:nowrap;color:#0097a7;">affectedUrls</td><td style="padding:3px 8px;color:#555;">Array of all pages where this pattern appears</td></tr>
        </table>
      </details>
    </div>
  </div>

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
  await writeFile(filePath, buildHtml(report, filename), 'utf-8');
  return filePath;
}
