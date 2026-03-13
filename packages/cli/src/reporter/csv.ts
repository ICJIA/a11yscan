/**
 * CSV report writer — outputs pattern-grouped violation data.
 */

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { createObjectCsvWriter } = require('csv-writer');
import { mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { ViolationPattern } from '../analyzer/patterns.js';

const REPORTS_DIR = resolve(process.cwd(), 'reports');

/**
 * Write violation patterns to a CSV file.
 * Auto-creates ./reports/ directory if it doesn't exist.
 *
 * @returns The absolute path to the written CSV file.
 */
export async function writeCSV(
  patterns: ViolationPattern[],
  filename: string
): Promise<string> {
  await mkdir(REPORTS_DIR, { recursive: true });

  const filePath = join(REPORTS_DIR, `${filename}.csv`);

  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: [
      { id: 'patternId', title: 'Pattern ID' },
      { id: 'violationId', title: 'Violation ID' },
      { id: 'impact', title: 'Impact' },
      { id: 'violationDescription', title: 'Description' },
      { id: 'normalizedSelector', title: 'Selector' },
      { id: 'affectedPageCount', title: 'Affected Pages' },
      { id: 'rootCauseHint', title: 'Root Cause Hint' },
      { id: 'suggestedFix', title: 'Suggested Fix URL' },
      { id: 'affectedUrlsJoined', title: 'Affected URLs' },
    ],
  });

  const records = patterns.map((p) => ({
    ...p,
    affectedUrlsJoined: p.affectedUrls.join('|'),
  }));

  await csvWriter.writeRecords(records);
  return filePath;
}
