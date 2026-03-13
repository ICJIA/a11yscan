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

  it('includes expected rules (color-contrast, aria-roles, etc.)', () => {
    const config = buildAxeConfig();
    const rules = config.runOnly.values;

    expect(rules).toContain('color-contrast');
    expect(rules).toContain('aria-roles');
    expect(rules).toContain('image-alt');
    expect(rules).toContain('link-name');
    expect(rules).toContain('button-name');
    expect(rules).toContain('label');
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
