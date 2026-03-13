/**
 * a11y.config.ts — Single source of truth for a11yscan configuration.
 *
 * This file centralizes all configurable values for the CLI tool.
 * Values are arranged from most-frequently-changed (top) to
 * rarely-changed internals (bottom).
 *
 * ┌─────────────────────────────────────────────────┐
 * │  EASY CHANGES (top)     — tweak freely          │
 * │  MODERATE CHANGES       — understand first       │
 * │  CAREFUL CHANGES (bottom) — test after editing   │
 * └─────────────────────────────────────────────────┘
 */

// ─────────────────────────────────────────────────────────────────────────────
// EASY CHANGES — Safe to modify for any deployment or scan run.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tool identity — shown in reports and terminal output.
 */
export const TOOL_NAME = 'a11yscan';
export const TOOL_VERSION = '1.5.1';

/**
 * Default output formats when --output is not specified.
 * Valid values: 'csv', 'json', 'html', 'md'
 */
export const DEFAULT_OUTPUT_FORMATS = ['csv', 'json', 'html'];

/**
 * Default base filename for reports (timestamp is appended automatically).
 * Example output: aria-report-2026-03-13-1400.json
 */
export const DEFAULT_REPORT_PREFIX = 'aria-report';

/**
 * Directory where reports are written (relative to cwd).
 */
export const REPORTS_DIR = 'reports';

/**
 * Default concurrency — how many pages to scan in parallel.
 * Higher values = faster scans, but more memory and CPU.
 * Range: 1–5 (enforced by CLI flag validation).
 */
export const DEFAULT_CONCURRENCY = 5;

/**
 * Default number of report runs to keep per site (or section).
 * After each scan, older runs beyond this count are deleted.
 * Set to 0 to disable automatic pruning.
 */
export const DEFAULT_KEEP_REPORTS = 3;

// ─────────────────────────────────────────────────────────────────────────────
// MODERATE CHANGES — Understand the implications before editing.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Concurrency limits.
 * MIN: Setting below 1 disables parallelism (always 1).
 * MAX: Setting above 5 may cause browser instability or IP rate-limiting.
 */
export const MIN_CONCURRENCY = 1;
export const MAX_CONCURRENCY = 5;

/**
 * Timeouts (in milliseconds).
 *
 * PAGE_TIMEOUT: How long to wait for a page to load before giving up.
 *   - 30s works for most sites; increase to 60s for slow CMS pages.
 *
 * NETWORK_IDLE_TIMEOUT: Best-effort wait for network activity to settle.
 *   - Used after the initial page load for SPAs that fetch data client-side.
 *   - If this times out, the scan still proceeds (it's a best-effort wait).
 *
 * SITEMAP_TIMEOUT: How long to wait for the sitemap.xml to download.
 */
export const PAGE_TIMEOUT = 30_000;
export const NETWORK_IDLE_TIMEOUT = 10_000;
export const SITEMAP_TIMEOUT = 15_000;

/**
 * Post-load delay (ms) before running axe-core.
 * Gives JavaScript frameworks a moment to finish rendering.
 * 500ms is a safe default; reduce to 200ms for static sites.
 */
export const POST_LOAD_DELAY = 500;

/**
 * Sitemap retry delay (ms).
 * If the first sitemap fetch fails, wait this long before retrying once.
 */
export const SITEMAP_RETRY_DELAY = 5_000;

/**
 * Valid output format options. Used for CLI flag validation.
 */
export const VALID_OUTPUT_FORMATS = ['csv', 'json', 'html', 'md'] as const;

// ─────────────────────────────────────────────────────────────────────────────
// CAREFUL CHANGES — These affect scan coverage and accuracy.
// Changing these may produce different violation results.
// Test thoroughly after editing.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * axe-core rules to run.
 *
 * These are the specific rule IDs passed to AxeBuilder via runOnly.
 * Adding rules increases scan coverage but also scan time.
 * Removing rules means those violation types won't be detected.
 *
 * Full rule list: https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md
 */
export const AXE_RULE_IDS = [
  // ── ARIA Roles ──
  'aria-allowed-role',        // Role attribute value must be valid
  'aria-required-children',   // Required ARIA children roles must be present
  'aria-required-parent',     // Required ARIA parent roles must be present
  'aria-roles',               // Role attribute must have a valid value
  'aria-prohibited-attr',     // ARIA attributes must not be prohibited

  // ── Accessible Names ──
  'aria-input-field-name',    // ARIA input fields must have an accessible name
  'aria-toggle-field-name',   // ARIA toggle fields must have an accessible name
  'button-name',              // Buttons must have discernible text
  'input-button-name',        // Input buttons must have discernible text
  'image-alt',                // Images must have alt text
  'label',                    // Form elements must have labels
  'link-name',                // Links must have discernible text

  // ── Color Contrast (WCAG 2.1 AA) ──
  'color-contrast',           // Elements must meet minimum color contrast ratio (4.5:1)
] as const;

/**
 * Hosts that are blocked from scanning (SSRF prevention).
 * These prevent the tool from scanning localhost, loopback, or private IPs.
 */
export const BLOCKED_HOSTS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '[::1]',
] as const;

/**
 * Root cause hint patterns.
 *
 * These map CSS selector patterns to human-readable hints about why a
 * violation might exist. Used in pattern analysis to help developers
 * quickly identify the source of repeated issues (e.g., a Vuetify
 * component, a WordPress plugin, etc.).
 *
 * Pattern: RegExp to match against the normalized CSS selector.
 * Hint: Short description shown in reports.
 */
export const ROOT_CAUSE_HINTS: ReadonlyArray<{ pattern: RegExp; hint: string }> = [
  { pattern: /^\.v-/,                  hint: 'Likely Vuetify component' },
  { pattern: /^\.nuxt-/,               hint: 'Likely Nuxt framework element' },
  { pattern: /^\.wp-/,                 hint: 'Likely WordPress theme/plugin' },
  { pattern: /^\.elementor-/,          hint: 'Likely Elementor page builder' },
  { pattern: /^\.woocommerce/,         hint: 'Likely WooCommerce plugin' },
  { pattern: /^\.shopify-/,            hint: 'Likely Shopify theme' },
  { pattern: /^\.MuiButtonBase/,       hint: 'Likely Material UI component' },
  { pattern: /^\.css-[a-z0-9]{5,}/,    hint: 'Likely CSS-in-JS (Emotion/Styled)' },
  { pattern: /^\.docsearch-/,          hint: 'Likely DocSearch/Algolia widget' },
  { pattern: /^#__next/,               hint: 'Likely Next.js framework element' },
  { pattern: /^\.gatsby-/,             hint: 'Likely Gatsby framework element' },
  { pattern: /^\.chakra-/,             hint: 'Likely Chakra UI component' },
  { pattern: /^\.ant-/,                hint: 'Likely Ant Design component' },
  { pattern: /^\.bootstrap-/,          hint: 'Likely Bootstrap component' },
] as const;

/**
 * Exit codes used by the CLI.
 *
 * These follow Unix conventions and are used by CI/CD pipelines
 * to determine scan outcomes programmatically.
 */
export const EXIT_CODES = {
  /** Scan complete, no violations found */
  CLEAN: 0,
  /** Scan complete, violations found */
  VIOLATIONS: 1,
  /** Configuration or fetch error */
  CONFIG_ERROR: 2,
  /** Scan interrupted (partial results written) */
  INTERRUPTED: 3,
} as const;

/**
 * Filename sanitization limits.
 * MAX_FILENAME_LENGTH: Truncates report filenames to this length.
 */
export const MAX_FILENAME_LENGTH = 100;

/**
 * CSV report column headers (in order).
 * Changing these will break any downstream CSV parsers that depend on column names.
 */
export const CSV_COLUMNS = [
  'Violation Type',
  'Pattern ID',
  'Description',
  'Impact',
  'Selector',
  'HTML Snippet',
  'Failure Summary',
  'Affected Pages',
  'Suggested Fix',
  'Root Cause Hint',
  'Affected URLs',
] as const;
