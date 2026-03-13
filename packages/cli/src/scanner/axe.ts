/**
 * axe-core configuration — maximum coverage rule set for a11yscan.
 *
 * Includes all axe-core rules for WCAG 2.1 AA compliance (wcag2a, wcag21a,
 * wcag2aa, wcag21aa, wcag22aa) PLUS all best-practice rules that catch
 * real-world accessibility issues beyond the WCAG spec.
 *
 * Total: 96 rules — the most thorough open-source axe-core scan possible.
 */

export const AXE_RULES = [
  // ── ARIA Roles & Attributes (WCAG 2.1 A) ────────────────────────────────
  'aria-allowed-attr',          // ARIA attributes must be allowed for the role
  'aria-allowed-role',          // ARIA role must be appropriate for element [best-practice]
  'aria-braille-equivalent',    // ARIA braille attributes must have non-braille equivalent
  'aria-command-name',          // ARIA command roles must have accessible name
  'aria-conditional-attr',      // ARIA attributes used conditionally must be valid
  'aria-deprecated-role',       // ARIA deprecated roles must not be used
  'aria-dialog-name',           // Dialog elements must have accessible name [best-practice]
  'aria-hidden-body',           // aria-hidden must not be on document body
  'aria-hidden-focus',          // aria-hidden elements must not be focusable
  'aria-input-field-name',      // ARIA input fields must have accessible name
  'aria-meter-name',            // ARIA meter elements must have accessible name
  'aria-progressbar-name',      // ARIA progressbar elements must have accessible name
  'aria-prohibited-attr',       // ARIA attributes must not be prohibited
  'aria-required-attr',         // Required ARIA attributes must be provided
  'aria-required-children',     // ARIA roles must contain required children
  'aria-required-parent',       // ARIA roles must be contained by required parent
  'aria-roledescription',       // aria-roledescription must be on elements with semantic role
  'aria-roles',                 // ARIA role attribute must have valid value
  'aria-text',                  // role=text must not contain focusable content [best-practice]
  'aria-toggle-field-name',     // ARIA toggle fields must have accessible name
  'aria-tooltip-name',          // ARIA tooltip elements must have accessible name
  'aria-treeitem-name',         // ARIA treeitem must have accessible name [best-practice]
  'aria-valid-attr',            // ARIA attributes must be valid
  'aria-valid-attr-value',      // ARIA attribute values must be valid

  // ── Accessible Names & Labels ────────────────────────────────────────────
  'area-alt',                   // <area> elements must have alt text
  'button-name',                // Buttons must have accessible name
  'empty-heading',              // Headings must have descriptive content [best-practice]
  'empty-table-header',         // Table headers must have descriptive content [best-practice]
  'frame-title',                // Frames must have accessible name
  'frame-title-unique',         // Frame titles must be unique
  'image-alt',                  // Images must have alt text
  'image-redundant-alt',        // Image alt text must not duplicate surrounding text [best-practice]
  'input-button-name',          // Input buttons must have accessible name
  'input-image-alt',            // Image inputs must have alt text
  'label',                      // Form elements must have labels
  'label-content-name-mismatch', // Label content must match accessible name (WCAG 2.1)
  'label-title-only',           // Form fields should not rely solely on title attribute [best-practice]
  'link-name',                  // Links must have accessible name
  'object-alt',                 // <object> elements must have alt text
  'role-img-alt',               // Elements with role="img" must have alt text
  'select-name',                // Select elements must have accessible name
  'summary-name',               // Summary elements must have accessible name
  'svg-img-alt',                // SVG elements with img role must have alt text

  // ── Color Contrast ───────────────────────────────────────────────────────
  'color-contrast',             // Text must have sufficient color contrast (WCAG AA)
  'link-in-text-block',         // Links in text blocks must be distinguishable

  // ── Document Structure ───────────────────────────────────────────────────
  'bypass',                     // Page must have means to bypass repeated blocks
  'document-title',             // Document must have <title>
  'duplicate-id-aria',          // IDs used in ARIA must be unique
  'heading-order',              // Heading levels should increase by one [best-practice]
  'html-has-lang',              // <html> must have lang attribute
  'html-lang-valid',            // lang attribute must have valid value
  'html-xml-lang-mismatch',     // xml:lang and lang must match
  'p-as-heading',               // <p> elements must not be styled as headings
  'page-has-heading-one',       // Page must have level-one heading [best-practice]
  'valid-lang',                 // lang attributes must have valid values

  // ── Landmarks & Regions ──────────────────────────────────────────────────
  'landmark-banner-is-top-level',        // Banner landmark must be top level [best-practice]
  'landmark-complementary-is-top-level', // Complementary landmark must be top level [best-practice]
  'landmark-contentinfo-is-top-level',   // Contentinfo landmark must be top level [best-practice]
  'landmark-main-is-top-level',          // Main landmark must be top level [best-practice]
  'landmark-no-duplicate-banner',        // At most one banner landmark [best-practice]
  'landmark-no-duplicate-contentinfo',   // At most one contentinfo landmark [best-practice]
  'landmark-no-duplicate-main',          // At most one main landmark [best-practice]
  'landmark-one-main',                   // Page must have exactly one main landmark [best-practice]
  'landmark-unique',                     // Landmarks must have unique accessible names [best-practice]
  'region',                              // All content must be within landmark regions [best-practice]
  'skip-link',                           // Valid skip link should be present [best-practice]

  // ── Lists & Definition Lists ─────────────────────────────────────────────
  'definition-list',            // <dl> elements must be structured correctly
  'dlitem',                     // <dt>/<dd> must be in <dl>
  'list',                       // <li> must be in <ul>/<ol>
  'listitem',                   // List items must be in a list container

  // ── Tables ───────────────────────────────────────────────────────────────
  'scope-attr-valid',           // Scope attribute on table cells must be valid [best-practice]
  'table-duplicate-name',       // Tables must not have duplicate accessible names [best-practice]
  'table-fake-caption',         // Tables must not use <caption> alternatives
  'td-has-header',              // Data cells must have headers
  'td-headers-attr',            // headers attribute must refer to valid cells
  'th-has-data-cells',          // <th> must have associated data cells

  // ── Forms & Inputs ───────────────────────────────────────────────────────
  'accesskeys',                 // accesskey values should be unique [best-practice]
  'autocomplete-valid',         // autocomplete attribute must be used correctly (WCAG 2.1)
  'form-field-multiple-labels', // Form fields must not have multiple labels
  'tabindex',                   // tabindex values should not be greater than 0 [best-practice]

  // ── Interactive Elements ─────────────────────────────────────────────────
  'frame-focusable-content',    // Frames with focusable content must have tabindex
  'nested-interactive',         // Interactive elements must not be nested
  'presentation-role-conflict', // Presentation role must not conflict with implicit role [best-practice]
  'scrollable-region-focusable', // Scrollable regions must be focusable

  // ── Media ────────────────────────────────────────────────────────────────
  'audio-caption',              // Audio elements must have captions
  'no-autoplay-audio',          // Audio must not autoplay
  'video-caption',              // Video elements must have captions

  // ── Visual & Layout ──────────────────────────────────────────────────────
  'avoid-inline-spacing',       // Inline text spacing must be adjustable (WCAG 2.1)
  'blink',                      // <blink> elements must not be used
  'css-orientation-lock',       // CSS must not lock display orientation (WCAG 2.1)
  'marquee',                    // <marquee> elements must not be used
  'meta-refresh',               // <meta http-equiv="refresh"> must not be used
  'meta-viewport',              // Viewport must not disable zoom
  'meta-viewport-large',        // Viewport zoom scale must allow magnification [best-practice]
  'server-side-image-map',      // Server-side image maps must not be used
  'target-size',                // Touch targets must be large enough (WCAG 2.2 AA)
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
