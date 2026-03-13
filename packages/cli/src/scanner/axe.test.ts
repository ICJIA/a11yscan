import { describe, it, expect } from 'vitest';
import { buildAxeConfig, AXE_RULES } from './axe.js';

describe('buildAxeConfig', () => {
  it('returns a valid config object', () => {
    const config = buildAxeConfig();

    expect(config).toBeDefined();
    expect(config.runOnly).toBeDefined();
    expect(config.runOnly.type).toBe('rule');
    expect(Array.isArray(config.runOnly.values)).toBe(true);
    expect(config.runOnly.values.length).toBeGreaterThan(0);
  });

  it('includes all WCAG 2.1 AA rule categories', () => {
    const config = buildAxeConfig();
    const rules = config.runOnly.values;

    // ARIA
    expect(rules).toContain('aria-roles');
    expect(rules).toContain('aria-required-attr');
    expect(rules).toContain('aria-valid-attr-value');
    expect(rules).toContain('aria-hidden-focus');
    // Accessible names
    expect(rules).toContain('image-alt');
    expect(rules).toContain('link-name');
    expect(rules).toContain('button-name');
    expect(rules).toContain('label');
    expect(rules).toContain('select-name');
    // Color contrast
    expect(rules).toContain('color-contrast');
    // Document structure
    expect(rules).toContain('document-title');
    expect(rules).toContain('html-has-lang');
    expect(rules).toContain('heading-order');
    expect(rules).toContain('bypass');
    // Tables
    expect(rules).toContain('td-has-header');
    // Forms
    expect(rules).toContain('autocomplete-valid');
    // Media
    expect(rules).toContain('video-caption');
    // Visual
    expect(rules).toContain('meta-viewport');
    expect(rules).toContain('target-size');
    // Best-practice rules
    expect(rules).toContain('empty-heading');
    expect(rules).toContain('landmark-one-main');
    expect(rules).toContain('region');
    expect(rules).toContain('skip-link');
    expect(rules).toContain('page-has-heading-one');
    // Should have 93 rules total
    expect(rules.length).toBe(96);
  });

  it('does NOT include color-contrast-enhanced (AAA rule was removed)', () => {
    const config = buildAxeConfig();
    const rules = config.runOnly.values;

    expect(rules).not.toContain('color-contrast-enhanced');
  });

  it('has resultTypes set via runOnly', () => {
    const config = buildAxeConfig();

    // The config uses runOnly with type 'rule' which controls which rules run
    expect(config.runOnly.type).toBe('rule');
    expect(config.runOnly.values).toEqual([...AXE_RULES]);
  });
});
