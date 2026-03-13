/**
 * Pattern analyzer — groups axe-core violations by normalized selector + violation ID.
 */

import type { AxeResults, Result, NodeResult } from 'axe-core';

export interface ViolationPattern {
  patternId: string;
  violationId: string;
  violationDescription: string;
  impact: string;
  normalizedSelector: string;
  affectedPageCount: number;
  affectedUrls: string[];
  suggestedFix: string;
  rootCauseHint: string;
}

/**
 * Normalize a CSS selector for pattern grouping.
 * - Strip :nth-child(...), :nth-of-type(...), and similar positional pseudo-classes
 * - Strip [style="..."] attribute selectors
 * - Lowercase the result
 */
export function normalizeSelector(selector: string): string {
  return (
    selector
      // Strip positional pseudo-classes: :nth-child(...), :nth-of-type(...), :first-child, :last-child, etc.
      .replace(/:nth-(?:child|of-type|last-child|last-of-type)\([^)]*\)/g, '')
      .replace(/:(?:first|last)-(?:child|of-type)/g, '')
      // Strip inline style attribute selectors
      .replace(/\[style(?:=[^\]]*)?]/g, '')
      // Collapse multiple spaces / > combinator whitespace
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
  );
}

/**
 * Determine root cause hint based on CSS selector patterns.
 * Uses pattern matching, not naive substring search, to avoid false positives.
 */
function getRootCauseHint(
  normalizedSelector: string,
  affectedPageCount: number,
  totalPages: number
): string {
  // Vuetify component: class starts with .v- (e.g., .v-btn, .v-autocomplete__content)
  if (/\.v-[a-z]/.test(normalizedSelector)) {
    return 'Likely Vuetify component';
  }

  // Nuxt layout element: .__nuxt, .nuxt-, #__nuxt
  if (/[.#]_?_?nuxt[-_]?/.test(normalizedSelector)) {
    return 'Likely Nuxt layout element';
  }

  // Shared layout component: <nav>, <header>, <footer> elements or ARIA landmark roles
  // Match element names at word boundaries to avoid matching "navigator", "overview", etc.
  if (
    /(?:^|[\s>+~])(?:nav|header|footer)(?:$|[\s>+~.#[:])/.test(normalizedSelector) ||
    /\[role=["']?(?:navigation|banner|contentinfo)["']?]/.test(normalizedSelector)
  ) {
    return 'Likely shared layout component';
  }

  // Global component: appears on >50% of scanned pages
  if (totalPages > 0 && affectedPageCount / totalPages > 0.5) {
    return 'Global component or template';
  }

  return 'Component-level issue';
}

/**
 * Analyze axe-core results from multiple pages and group violations by pattern.
 *
 * @param results - Map of URL to AxeResults
 * @param totalPages - Total number of pages scanned (for >50% threshold calculation)
 * @returns Array of ViolationPattern sorted by affectedPageCount descending
 */
export function analyzePatterns(
  results: Map<string, AxeResults>,
  totalPages: number
): ViolationPattern[] {
  // Accumulator: groupKey → { violationData, affectedUrls set }
  const patternMap = new Map<
    string,
    {
      violationId: string;
      violationDescription: string;
      impact: string;
      normalizedSelector: string;
      affectedUrls: Set<string>;
      suggestedFix: string;
    }
  >();

  for (const [url, axeResult] of results) {
    for (const violation of axeResult.violations) {
      for (const node of violation.nodes) {
        const selectorRaw = nodeTargetToString(node);
        const normalized = normalizeSelector(selectorRaw);
        const groupKey = `${violation.id}::${normalized}`;

        if (!patternMap.has(groupKey)) {
          patternMap.set(groupKey, {
            violationId: violation.id,
            violationDescription: violation.description,
            impact: violation.impact || 'moderate',
            normalizedSelector: normalized,
            affectedUrls: new Set<string>(),
            suggestedFix: violation.helpUrl,
          });
        }

        patternMap.get(groupKey)!.affectedUrls.add(url);
      }
    }
  }

  // Convert to array, sort by affected page count descending
  const patterns = Array.from(patternMap.values())
    .map((entry) => ({
      ...entry,
      affectedPageCount: entry.affectedUrls.size,
      affectedUrlsArray: Array.from(entry.affectedUrls),
    }))
    .sort((a, b) => b.affectedPageCount - a.affectedPageCount);

  // Assign pattern IDs and build final output
  return patterns.map((entry, index) => ({
    patternId: `P${String(index + 1).padStart(3, '0')}`,
    violationId: entry.violationId,
    violationDescription: entry.violationDescription,
    impact: entry.impact,
    normalizedSelector: entry.normalizedSelector,
    affectedPageCount: entry.affectedPageCount,
    affectedUrls: entry.affectedUrlsArray,
    suggestedFix: entry.suggestedFix,
    rootCauseHint: getRootCauseHint(
      entry.normalizedSelector,
      entry.affectedPageCount,
      totalPages
    ),
  }));
}

/**
 * Convert an axe-core node target to a string selector.
 */
function nodeTargetToString(node: NodeResult): string {
  if (node.target && node.target.length > 0) {
    // node.target is an array of selectors (for iframes, it's nested)
    // Use the last one (deepest) as the primary selector
    const target = node.target[node.target.length - 1];
    if (typeof target === 'string') {
      return target;
    }
    // For shadow DOM, target can be an array
    if (Array.isArray(target)) {
      return target.join(' > ');
    }
  }
  return node.html || 'unknown';
}
