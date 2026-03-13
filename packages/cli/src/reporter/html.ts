/**
 * HTML report writer — self-contained, human-readable accessibility report.
 * Patterns are grouped by violation type (e.g., all color-contrast patterns
 * under one heading, all aria-roles under another).
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { JsonReport } from './json.js';
import type { ViolationPattern } from '../analyzer/patterns.js';

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
