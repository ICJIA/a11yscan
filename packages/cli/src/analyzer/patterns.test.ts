import { describe, it, expect } from 'vitest';
import { normalizeSelector, analyzePatterns } from './patterns.js';
import type { AxeResults } from 'axe-core';

describe('normalizeSelector', () => {
  it('strips :nth-child() pseudo-classes', () => {
    expect(normalizeSelector('div.menu:nth-child(3) > span')).toBe('div.menu > span');
  });

  it('strips :nth-of-type() pseudo-classes', () => {
    expect(normalizeSelector('li:nth-of-type(2)')).toBe('li');
  });

  it('strips :first-child and :last-child', () => {
    expect(normalizeSelector('div:first-child')).toBe('div');
    expect(normalizeSelector('div:last-child')).toBe('div');
  });

  it('strips [style="..."] attribute selectors', () => {
    expect(normalizeSelector('button.v-btn[style="color:red"]')).toBe('button.v-btn');
  });

  it('lowercases the result', () => {
    expect(normalizeSelector('DIV.MyComponent')).toBe('div.mycomponent');
  });

  it('collapses whitespace', () => {
    expect(normalizeSelector('div   >   span')).toBe('div > span');
  });

  it('handles complex selectors', () => {
    expect(
      normalizeSelector('div.v-autocomplete:nth-child(1) > ul[style="display:none"]:nth-of-type(2)')
    ).toBe('div.v-autocomplete > ul');
  });
});

// Helper to create mock AxeResults
function mockAxeResults(violations: Array<{
  id: string;
  description: string;
  impact: string;
  helpUrl: string;
  selector: string;
}>): AxeResults {
  return {
    violations: violations.map((v) => ({
      id: v.id,
      description: v.description,
      impact: v.impact,
      helpUrl: v.helpUrl,
      help: '',
      tags: [],
      nodes: [
        {
          target: [v.selector],
          html: '<div></div>',
          impact: v.impact as 'critical' | 'serious' | 'moderate' | 'minor',
          any: [],
          all: [],
          none: [],
          failureSummary: '',
        },
      ],
    })),
    passes: [],
    incomplete: [],
    inapplicable: [],
    testEngine: { name: 'axe-core', version: '4.10.0' },
    testRunner: { name: 'axe' },
    testEnvironment: {
      userAgent: '',
      windowWidth: 0,
      windowHeight: 0,
      orientationAngle: 0,
      orientationType: '',
    },
    timestamp: new Date().toISOString(),
    url: '',
    toolOptions: {},
  } as unknown as AxeResults;
}

describe('analyzePatterns', () => {
  it('groups same violation+selector across multiple pages', () => {
    const results = new Map<string, AxeResults>();
    results.set('https://example.com/a', mockAxeResults([
      { id: 'aria-roles', description: 'Bad role', impact: 'critical', helpUrl: 'https://help', selector: '.v-autocomplete' },
    ]));
    results.set('https://example.com/b', mockAxeResults([
      { id: 'aria-roles', description: 'Bad role', impact: 'critical', helpUrl: 'https://help', selector: '.v-autocomplete' },
    ]));

    const patterns = analyzePatterns(results, 2);

    expect(patterns).toHaveLength(1);
    expect(patterns[0].affectedPageCount).toBe(2);
    expect(patterns[0].affectedUrls).toContain('https://example.com/a');
    expect(patterns[0].affectedUrls).toContain('https://example.com/b');
  });

  it('separates different violations on different selectors', () => {
    const results = new Map<string, AxeResults>();
    results.set('https://example.com/a', mockAxeResults([
      { id: 'aria-roles', description: 'Bad role', impact: 'critical', helpUrl: 'https://help', selector: '.v-btn' },
      { id: 'color-contrast', description: 'Low contrast', impact: 'serious', helpUrl: 'https://help2', selector: '.text-muted' },
    ]));

    const patterns = analyzePatterns(results, 1);
    expect(patterns).toHaveLength(2);
  });

  it('sorts by affectedPageCount descending', () => {
    const results = new Map<string, AxeResults>();
    results.set('https://example.com/a', mockAxeResults([
      { id: 'aria-roles', description: 'Bad role', impact: 'critical', helpUrl: '', selector: '.rare-thing' },
      { id: 'color-contrast', description: 'Low contrast', impact: 'serious', helpUrl: '', selector: '.common-thing' },
    ]));
    results.set('https://example.com/b', mockAxeResults([
      { id: 'color-contrast', description: 'Low contrast', impact: 'serious', helpUrl: '', selector: '.common-thing' },
    ]));

    const patterns = analyzePatterns(results, 2);
    expect(patterns[0].violationId).toBe('color-contrast');
    expect(patterns[0].patternId).toBe('P001');
    expect(patterns[1].violationId).toBe('aria-roles');
    expect(patterns[1].patternId).toBe('P002');
  });

  it('assigns sequential pattern IDs', () => {
    const results = new Map<string, AxeResults>();
    results.set('https://example.com/a', mockAxeResults([
      { id: 'a', description: '', impact: 'minor', helpUrl: '', selector: '.x' },
      { id: 'b', description: '', impact: 'minor', helpUrl: '', selector: '.y' },
      { id: 'c', description: '', impact: 'minor', helpUrl: '', selector: '.z' },
    ]));

    const patterns = analyzePatterns(results, 1);
    expect(patterns.map((p) => p.patternId)).toEqual(['P001', 'P002', 'P003']);
  });
});

describe('root cause hints', () => {
  it('detects Vuetify components (.v- class prefix)', () => {
    const results = new Map<string, AxeResults>();
    results.set('https://example.com/a', mockAxeResults([
      { id: 'aria-roles', description: '', impact: 'critical', helpUrl: '', selector: '.v-autocomplete__content' },
    ]));

    const patterns = analyzePatterns(results, 10);
    expect(patterns[0].rootCauseHint).toBe('Likely Vuetify component');
  });

  it('does not false-positive on selectors containing "v-" in other contexts', () => {
    const results = new Map<string, AxeResults>();
    results.set('https://example.com/a', mockAxeResults([
      { id: 'aria-roles', description: '', impact: 'critical', helpUrl: '', selector: '.overview-panel' },
    ]));

    const patterns = analyzePatterns(results, 10);
    expect(patterns[0].rootCauseHint).not.toBe('Likely Vuetify component');
  });

  it('detects Nuxt layout elements', () => {
    const results = new Map<string, AxeResults>();
    results.set('https://example.com/a', mockAxeResults([
      { id: 'aria-roles', description: '', impact: 'critical', helpUrl: '', selector: '#__nuxt' },
    ]));

    const patterns = analyzePatterns(results, 10);
    expect(patterns[0].rootCauseHint).toBe('Likely Nuxt layout element');
  });

  it('detects shared layout components (nav, header, footer)', () => {
    const results = new Map<string, AxeResults>();
    results.set('https://example.com/a', mockAxeResults([
      { id: 'link-name', description: '', impact: 'serious', helpUrl: '', selector: 'nav > ul > li > a' },
    ]));

    const patterns = analyzePatterns(results, 10);
    expect(patterns[0].rootCauseHint).toBe('Likely shared layout component');
  });

  it('does not false-positive nav inside other words like "navigator"', () => {
    const results = new Map<string, AxeResults>();
    results.set('https://example.com/a', mockAxeResults([
      { id: 'link-name', description: '', impact: 'serious', helpUrl: '', selector: '.navigator-panel' },
    ]));

    const patterns = analyzePatterns(results, 10);
    expect(patterns[0].rootCauseHint).not.toBe('Likely shared layout component');
  });

  it('detects global components (>50% of pages)', () => {
    const results = new Map<string, AxeResults>();
    // 6 out of 10 pages have this violation
    for (let i = 0; i < 6; i++) {
      results.set(`https://example.com/page-${i}`, mockAxeResults([
        { id: 'button-name', description: '', impact: 'serious', helpUrl: '', selector: '.some-widget' },
      ]));
    }

    const patterns = analyzePatterns(results, 10);
    expect(patterns[0].rootCauseHint).toBe('Global component or template');
  });

  it('defaults to "Component-level issue"', () => {
    const results = new Map<string, AxeResults>();
    results.set('https://example.com/a', mockAxeResults([
      { id: 'button-name', description: '', impact: 'serious', helpUrl: '', selector: '.some-random-button' },
    ]));

    const patterns = analyzePatterns(results, 10);
    expect(patterns[0].rootCauseHint).toBe('Component-level issue');
  });
});
