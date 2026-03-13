# a11yscan — Phase 1: Core CLI
**Doc 01 of 12**
Version 1.0 | March 2026

---

## Phase 1 Goal

A working end-to-end CLI tool: fetch a sitemap, filter URLs, render pages with Playwright, run axe-core, group violations by pattern, and output CSV and JSON reports. No wizard, no HTML report, no profiles yet — just a solid, tested foundation.

**End of Phase 1 deliverable:** `a11yscan --sitemap <url> --filter <path> --output csv,json` works correctly on a real site and produces accurate, pattern-grouped reports.

---

## Scope

### In Phase 1
- `pnpm` monorepo scaffold (`packages/cli`)
- TypeScript strict mode setup
- Commander-based flag parsing
- Sitemap fetch and XML parse (including nested sitemaps)
- URL filter engine: prefix, exclude list, depth, limit
- Playwright page scanner with full SPA render wait
- axe-core injection scoped to: ARIA roles, accessible names, color contrast
- Violation pattern grouper
- CSV reporter
- JSON reporter
- `./reports/` output directory (auto-created)
- `--filename` flag for custom report names
- Basic chalk-colored terminal output (start, progress count, done summary)
- `--ci` flag: suppress decorative output, exit code 1 on violations
- `--concurrency <n>` flag (default: 3, max: 5) using `p-limit` for parallel scanning
- Glob pattern URL filtering via `--filter-glob`
- README with install instructions for macOS, Linux, and WSL2 (using pnpm)
- Unit tests via Vitest for core modules

### Deferred to Later Phases
- Interactive wizard (Phase 3)
- HTML report (Phase 2)
- Markdown report (Phase 2)
- ora spinner / cli-progress bar (Phase 2)
- Puppeteer engine option (Phase 4)
- Profile save/load (Phase 3)
- `--full-wcag` flag (Phase 4)
- Marketing site (Phase 5)

---

## CLI Flags — Phase 1

| Flag | Type | Default | Description |
|---|---|---|---|
| `--sitemap <url>` | string | required | URL to sitemap.xml |
| `--filter <path>` | string | (all pages) | Path prefix to include (e.g. `/research`) |
| `--filter-glob <pattern>` | string | (none) | Glob pattern to include (e.g. `/research/*/reports`) |
| `--exclude <paths>` | string | none | Comma-separated path prefixes to exclude (whitespace around commas is trimmed) |
| `--depth <n>` | number | unlimited | Max URL path depth to include |
| `--limit <n>` | number | unlimited | Max number of pages to scan |
| `--output <formats>` | string | `csv,json` | Comma-separated: csv, json |
| `--filename <name>` | string | `aria-report-{ts}` | Base filename for report files |
| `--filter-glob <pattern>` | string | (none) | Glob pattern to match URL pathnames (e.g. `/research/*/reports`) |
| `--concurrency <n>` | number | `3` | Parallel pages to scan (1–5) |
| `--ci` | boolean | false | CI mode: minimal output, exit 1 on violations |
| `--help` | — | — | Show help |
| `--version` | — | — | Show version |

---

## File Structure — Phase 1

```
packages/cli/
├── src/
│   ├── index.ts                  # Entry: parse args, route to direct mode
│   ├── cli/
│   │   └── direct.ts             # Commander setup, flag definitions
│   ├── sitemap/
│   │   ├── fetcher.ts            # Fetch sitemap XML, handle nested sitemaps
│   │   ├── fetcher.test.ts       # isSafeUrl() unit tests
│   │   ├── filter.ts             # URL filtering: prefix, glob, exclude, depth, limit
│   │   └── filter.test.ts        # Filter logic unit tests
│   ├── scanner/
│   │   ├── playwright.ts         # Launch browser, navigate, wait for SPA, inject axe
│   │   └── axe.ts                # axe-core config, rule sets, result normalization
│   ├── analyzer/
│   │   ├── patterns.ts           # Group violations by selector+type, frequency sort
│   │   └── patterns.test.ts      # Pattern grouping + root cause hint unit tests
│   └── reporter/
│       ├── csv.ts                # CSV report writer
│       ├── csv.test.ts           # CSV output unit tests
│       ├── json.ts               # JSON report writer
│       └── json.test.ts          # JSON output + filename sanitization unit tests
├── package.json
├── tsconfig.json
└── README.md
```

---

## Key Implementation Details

### Sitemap Fetching (`sitemap/fetcher.ts`)
- Use `sitemapper` package to fetch and parse `sitemap.xml`
- Handle `<sitemapindex>` (nested sitemaps) automatically — sitemapper does this
- Return flat array of URLs
- Graceful error if sitemap unreachable (non-zero exit with message)
- Respect `robots.txt` crawl delay if present (optional Phase 1 stretch goal)

### URL Filtering (`sitemap/filter.ts`)
```typescript
interface FilterOptions {
  filter?: string;        // path prefix to include: "/research"
  filterGlob?: string;    // glob pattern to match: "/research/*/reports"
  exclude?: string[];     // path prefixes to exclude: ["/research/archive"]
  depth?: number;         // max path segments: 3 → /a/b/c allowed, /a/b/c/d excluded
  limit?: number;         // max URLs after filtering
}
```
- `filter` is a **startsWith** match on the URL pathname
- `filterGlob` uses the `picomatch` package for glob matching on the URL pathname (e.g., `/research/*/reports`, `/en/**/news`)
- `filter` and `filterGlob` can be combined — URL must match **both** if both are provided
- `exclude` is a **startsWith** match — any matching URL is dropped
- `depth` counts `/`-separated segments in the pathname (root `/` = depth 0)
- `limit` applies **after** all other filters
- Log filtered counts: "Found 1,860 URLs → filtered to 340 matching /research"

### `--exclude` Parsing Behavior
The `--exclude` flag accepts a comma-separated string. Whitespace around commas is trimmed:
- `--exclude "/a,/b"` → `["/a", "/b"]`
- `--exclude "/a, /b"` → `["/a", "/b"]` (trimmed)
- Multiple `--exclude` flags are **not** supported; use comma separation

### Playwright Scanner (`scanner/playwright.ts`)
- Launch Chromium (bundled with Playwright) in headless mode
- Navigate to URL
- **SPA render wait strategy** (in order):
  1. Wait for `networkidle` (no network activity for 500ms)
  2. Wait for `DOMContentLoaded`
  3. Optional: `--wait-for-selector <selector>` flag (Phase 4)
- Inject axe-core script via `page.addScriptTag`
- Run `axe.run()` with scoped rule configuration
- Return raw axe results
- Configurable timeout per page (default: 30s)
- Skip and log URLs that timeout or return HTTP errors
- Concurrency: default 3 parallel pages via `p-limit` (configurable via `--concurrency` flag, max 5)
- Reuse a single browser instance; open multiple pages concurrently

### axe-core Configuration (`scanner/axe.ts`)
```typescript
const AXE_RULES = {
  // ARIA Roles
  'aria-allowed-role': { enabled: true },
  'aria-required-children': { enabled: true },
  'aria-required-parent': { enabled: true },
  'aria-roles': { enabled: true },
  'aria-prohibited-attr': { enabled: true },
  // Accessible Names
  'aria-label': { enabled: true },
  'button-name': { enabled: true },
  'input-button-name': { enabled: true },
  'image-alt': { enabled: true },
  'label': { enabled: true },
  'link-name': { enabled: true },
  // Color Contrast
  'color-contrast': { enabled: true },
  'color-contrast-enhanced': { enabled: true },
};

// All other rules disabled
const AXE_CONFIG = {
  rules: Object.fromEntries(
    Object.entries(AXE_RULES)
  ),
  runOnly: { type: 'rule', values: Object.keys(AXE_RULES) }
};
```

### Pattern Analyzer (`analyzer/patterns.ts`)
Group key: `${violation.id}::${normalizeSelector(node.target)}`

Selector normalization:
- Strip `:nth-child(n)` and similar positional pseudo-classes
- Strip inline style attributes from selector
- Lowercase
- Goal: `button.v-btn.primary` not `button.v-btn.primary:nth-child(3)[style="color:red"]`

Pattern record shape:
```typescript
interface ViolationPattern {
  patternId: string;           // e.g., "P001"
  violationId: string;         // axe rule ID
  violationDescription: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  normalizedSelector: string;
  affectedPageCount: number;
  affectedUrls: string[];
  suggestedFix: string;        // from axe helpUrl
  rootCauseHint: string;       // derived from selector patterns (see below)
}
```

Root cause hint derivation (Phase 1 — heuristic, subject to refinement after real-world testing):
- Selector matches `.v-` or `[class*="v-"]` (Vuetify class prefix pattern) → "Likely Vuetify component"
- Selector matches `.__nuxt` or `.nuxt-` or `#__nuxt` → "Likely Nuxt layout element"
- Selector matches `<nav>`, `<header>`, `<footer>`, or `[role="navigation"]`, `[role="banner"]`, `[role="contentinfo"]` → "Likely shared layout component"
- Selector appears on >50% of scanned pages → "Global component or template"
- Default: "Component-level issue"

> **Note:** These heuristics use CSS selector pattern matching, not substring search, to avoid false positives (e.g., `div.overview` should not match the `nav` hint). The logic will need refinement based on real-world usage — see Doc 10 gap analysis.

### CSV Reporter (`reporter/csv.ts`)
Columns:
```
Pattern ID, Violation ID, Impact, Description, Selector, Affected Pages, Root Cause Hint, Suggested Fix, Affected URLs (pipe-separated)
```

### JSON Reporter (`reporter/json.ts`)
```json
{
  "meta": {
    "generatedAt": "ISO timestamp",
    "sitemap": "url",
    "filter": "/research",
    "pagesScanned": 340,
    "pagesSkipped": 2,
    "totalViolations": 1240,
    "totalPatterns": 12,
    "tool": "a11yscan",
    "version": "1.0.0"
  },
  "patterns": [ ...ViolationPattern[] ],
  "skippedUrls": [ { "url": "...", "reason": "timeout" } ]
}
```

---

## Terminal Output (Phase 1)

```
a11yscan v1.0.0

Fetching sitemap... 1,860 URLs found
Applying filters... 340 URLs matched /research (excluding /research/archive)
Scanning 340 pages with Playwright (concurrency: 3)...
[12/340] https://icjia.illinois.gov/research/reports/2024-annual...
...
Scan complete.

Pages scanned:  338
Pages skipped:  2 (timeout)
Total violations: 1,240
Patterns found:   12

Reports saved to ./reports/
  aria-report-2026-03-06.csv
  aria-report-2026-03-06.json
```

---

## Error Recovery Strategy

### Sitemap Fetch Failures
- HTTP 4xx/5xx: exit with code 2 and a descriptive error message (not exit code 1, which means "violations found")
- Network timeout: retry once after 5s; if second attempt fails, exit with code 2
- Invalid XML: exit with code 2 and message suggesting the user verify the sitemap URL

### Per-Page Scan Failures
- Navigation timeout (30s default): skip page, log to `skippedUrls` with reason `"timeout"`
- HTTP error (4xx/5xx): skip page, log with reason `"http-{statusCode}"`
- Playwright crash / browser disconnect: attempt to relaunch browser once; if relaunch fails, write a **partial report** with all results collected so far, log the failure, and exit with code 3
- axe-core injection failure: skip page, log with reason `"axe-injection-error"`

### Partial Reports
If a scan is interrupted (browser crash, Ctrl+C via SIGINT), the tool should:
1. Write reports for all pages scanned so far
2. Add `"interrupted": true` and `"interruptReason": "..."` to the JSON report meta
3. Log: "Scan interrupted. Partial reports saved to ./reports/"

### Exit Codes
| Code | Meaning |
|---|---|
| 0 | Scan complete, no violations (or violations below `--threshold`) |
| 1 | Scan complete, violations found above threshold |
| 2 | Configuration or fetch error (bad sitemap URL, invalid flags) |
| 3 | Scan interrupted (browser crash, partial results written) |

---

## Test Strategy

### Framework
- **Vitest** as the test runner (already in scripts)
- Test files: `src/**/*.test.ts` colocated with source files
- Run: `pnpm --filter cli test`

### Unit Tests Required (Phase 1)

| Module | File | Tests |
|---|---|---|
| URL filter | `src/sitemap/filter.test.ts` | `filter` prefix matching, `filterGlob` pattern matching, `exclude` with whitespace trimming, `depth` counting, `limit` slicing, combined filters |
| URL safety | `src/sitemap/fetcher.test.ts` | `isSafeUrl()` blocks localhost, 127.0.0.1, 10.x.x.x, 172.16-31.x.x, 192.168.x.x, ::1, 169.254.x.x; allows valid public URLs |
| Selector normalization | `src/analyzer/patterns.test.ts` | Strips `:nth-child()`, strips inline styles, lowercases, preserves class names |
| Pattern grouping | `src/analyzer/patterns.test.ts` | Groups same violation+selector across pages, counts correctly, sorts by frequency |
| Root cause hints | `src/analyzer/patterns.test.ts` | Vuetify `.v-` class patterns, Nuxt `.__nuxt` patterns, `<nav>`/`<header>`/`<footer>` element patterns, >50% threshold, default hint |
| Filename sanitization | `src/reporter/json.test.ts` | Strips path separators, rejects `../`, truncates to 100 chars |
| CSV output | `src/reporter/csv.test.ts` | Valid CSV structure, correct column count, pipe-separated URLs |
| JSON output | `src/reporter/json.test.ts` | Valid JSON, correct meta shape, patterns array present |

### Integration Tests (Manual — Phase 1 Testing Checklist below)
These are run manually against real sites and verified by hand.

---

## Phase 1 Testing Checklist

Before Phase 1 is considered complete, verify all of the following:

- [ ] `pnpm install` from repo root installs all dependencies
- [ ] `.nvmrc` exists at repo root and contains `20`
- [ ] `.gitignore` excludes `node_modules/`, `dist/`, `reports/`, `profiles/`, `.env`
- [ ] `.npmrc` exists with `shamefully-hoist=false`
- [ ] `pnpm --filter cli build` compiles TypeScript without errors
- [ ] `a11yscan --help` displays all flags with descriptions
- [ ] `a11yscan --version` displays correct version
- [ ] Sitemap fetch works for a real public sitemap URL
- [ ] Nested sitemaps (`<sitemapindex>`) are resolved and flattened
- [ ] `--filter /research` returns only URLs starting with `/research`
- [ ] `--exclude /research/archive` removes matching URLs
- [ ] `--depth 2` excludes URLs with more than 2 path segments
- [ ] `--filter-glob "/research/*/reports"` matches expected URL patterns
- [ ] `--filter` and `--filter-glob` combined: URL must match both
- [ ] `--exclude "/a, /b"` trims whitespace correctly
- [ ] `--limit 10` caps scan at 10 pages
- [ ] `--concurrency 3` scans 3 pages in parallel
- [ ] `--concurrency 1` reverts to serial scanning
- [ ] Playwright successfully renders a known SPA (Vue/Nuxt site)
- [ ] axe-core runs and returns violations for a page with known issues
- [ ] Pattern grouper correctly aggregates multiple pages under one pattern
- [ ] Root cause hints fire correctly for Vuetify selectors
- [ ] CSV report is valid and opens correctly in Excel/Google Sheets
- [ ] JSON report passes JSON schema validation
- [ ] `./reports/` directory is created if it doesn't exist
- [ ] `--filename custom-name` produces `custom-name.csv` and `custom-name.json`
- [ ] `--ci` flag exits with code 1 when violations found
- [ ] `--ci` flag exits with code 0 when no violations found
- [ ] Skipped URLs (timeout, HTTP error) are logged and included in JSON meta
- [ ] Browser crash triggers relaunch attempt and partial report on second failure
- [ ] SIGINT (Ctrl+C) writes partial report with `interrupted: true` in JSON meta
- [ ] Exit code 0/1/2/3 match the documented exit code table
- [ ] `pnpm --filter cli test` runs all unit tests and they pass
- [ ] Tool runs correctly on macOS
- [ ] Tool runs correctly on Ubuntu 22.04
- [ ] Tool runs correctly inside WSL2 (Ubuntu)
- [ ] README install instructions verified on clean machine
