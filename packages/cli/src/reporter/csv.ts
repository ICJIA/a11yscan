/**
 * CSV report writer — outputs violation patterns grouped by violation type.
 * Patterns are sorted by violation ID first (grouping them), then by
 * affected page count descending within each group.
 */

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { createObjectCsvWriter } = require('csv-writer');
import { mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { ViolationPattern } from '../analyzer/patterns.js';

const REPORTS_DIR = resolve(process.cwd(), 'reports');

/**
 * Write violation patterns to a CSV file, grouped by violation type.
 * Auto-creates ./reports/ directory if it doesn't exist.
 *
 * @returns The absolute path to the written CSV file.
 */
export async function writeCSV(
  patterns: ViolationPattern[],
  filename: string,
  siteReportsDir?: string
): Promise<string> {
  const dir = siteReportsDir || REPORTS_DIR;
  await mkdir(dir, { recursive: true });

  const filePath = join(dir, `${filename}.csv`);

  // Sort: group by violationId, then by affectedPageCount descending within each group
  const sorted = [...patterns].sort((a, b) => {
    if (a.violationId !== b.violationId) {
      return a.violationId.localeCompare(b.violationId);
    }
    return b.affectedPageCount - a.affectedPageCount;
  });

  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: [
      { id: 'violationId', title: 'Violation Type' },
      { id: 'patternId', title: 'Pattern ID' },
      { id: 'impact', title: 'Impact' },
      { id: 'violationDescription', title: 'Description' },
      { id: 'normalizedSelector', title: 'Selector' },
      { id: 'affectedPageCount', title: 'Affected Pages' },
      { id: 'rootCauseHint', title: 'Root Cause Hint' },
      { id: 'htmlSnippet', title: 'HTML Snippet' },
      { id: 'failureSummary', title: 'Failure Summary' },
      { id: 'suggestedFix', title: 'Fix Guide URL' },
      { id: 'affectedUrlsJoined', title: 'Affected URLs' },
    ],
  });

  const records = sorted.map((p) => ({
    ...p,
    affectedUrlsJoined: p.affectedUrls.join('|'),
  }));

  await csvWriter.writeRecords(records);
  return filePath;
}
