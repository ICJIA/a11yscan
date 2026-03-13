/**
 * axe-core configuration — scoped rule sets for a11yscan.
 * Enables only ARIA roles, accessible names, and color contrast rules.
 */

export const AXE_RULES = [
  // ARIA Roles
  'aria-allowed-role',
  'aria-required-children',
  'aria-required-parent',
  'aria-roles',
  'aria-prohibited-attr',
  // Accessible Names
  'aria-input-field-name',
  'aria-toggle-field-name',
  'button-name',
  'input-button-name',
  'image-alt',
  'label',
  'link-name',
  // Color Contrast (WCAG 2.1 AA)
  'color-contrast',
] as const;

export type AxeRuleId = (typeof AXE_RULES)[number];

export interface AxeRunConfig {
  runOnly: {
    type: 'rule';
    values: string[];
  };
}

export function buildAxeConfig(): AxeRunConfig {
  return {
    runOnly: {
      type: 'rule',
      values: [...AXE_RULES],
    },
  };
}
