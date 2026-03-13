# a11yscan — Phase 4: Puppeteer Engine, CI Mode & Advanced Flags
**Doc 04 of 12**
Version 1.0 | March 2026

---

## Phase 4 Goal

Add Puppeteer as an optional browser engine, harden CI/CD integration, add `--wait-for-selector` for tricky SPAs, add `--full-wcag` for broad audits, and expose concurrency and timeout tuning. End of Phase 4: the tool is production-hardened and suitable for integration into state agency CI/CD pipelines.

**End of Phase 4 deliverable:** `--engine puppeteer` works. `--ci` produces machine-parseable output. `--full-wcag` enables all axe-core rules. All edge cases documented.

---

## Scope

### In Phase 4
- Puppeteer engine (`--engine puppeteer`)
- Engine auto-detection fallback (if Playwright not installed, try Puppeteer)
- `--wait-for-selector <selector>` — wait for a DOM element before scanning (SPA readiness)
- `--wait-timeout <ms>` — per-page timeout (default: 30000ms)
- `--full-wcag` — enable all axe-core WCAG 2.1 AA rules
- `--ignore-rules <rules>` — comma-separated axe rule IDs to suppress
- CI mode hardening: structured JSON to stdout, stderr for errors only
- `--threshold <n>` — exit 1 only if violation count exceeds n (CI tuning)
- `--min-impact <level>` — only report violations at or above: critical, serious, moderate, minor
- User-agent spoofing option (some sites block headless browsers)

### Deferred
- Marketing site (Phase 5)
- Authenticated scanning (future consideration, not currently planned)

---

## Puppeteer Engine

Puppeteer is an **optional peer dependency** — not installed by default. Users who prefer Puppeteer or have Playwright installation issues can opt in.

### Installation note (README addition):
```bash
# Default: Playwright
pnpm add -g a11yscan
npx playwright install chromium

# Optional: Puppeteer engine
pnpm add -g puppeteer
a11yscan --engine puppeteer
```

### Engine parity requirements
Both engines must:
- Launch headless Chromium
- Navigate to URL and wait for SPA render (networkidle)
- Support `--wait-for-selector`
- Support `--wait-timeout`
- Inject and run axe-core
- Return identical normalized result format to the pattern analyzer

### Engine selection logic (`scanner/engine-resolver.ts`):
```
1. If --engine playwright → use Playwright (error if not installed)
2. If --engine puppeteer → use Puppeteer (error if not installed)
3. If --engine not specified:
   a. Try Playwright → use if available
   b. Try Puppeteer → use if available
   c. Error with install instructions if neither found
```

---

## SPA Wait Strategies

### `--wait-for-selector <selector>`
Wait for a specific element to appear in the DOM before scanning. Useful for SPAs that render content asynchronously beyond `networkidle`.

```bash
a11yscan --sitemap https://... \
  --wait-for-selector ".v-app" \
  --wait-timeout 10000
```

Combined wait strategy (both engines):
1. Wait for `networkidle` (or `networkidle0` in Puppeteer)
2. If `--wait-for-selector` provided: additionally wait for selector (up to `--wait-timeout`)
3. Short fixed delay (500ms) after networkidle as safety buffer

---

## `--full-wcag` Flag

When passed, enables all axe-core WCAG 2.1 AA rules instead of the focused rule set.

```bash
a11yscan --sitemap https://... --full-wcag --output html
```

Report header notes when `--full-wcag` was used. Pattern grouping still applies. This mode will produce significantly more violations — `--limit` is recommended.

---

## CI/CD Integration

### `--ci` flag behavior (hardened in Phase 4):
- All decorative output (spinners, progress bars, color) suppressed
- Only errors go to stderr
- Final summary JSON printed to stdout:

```json
{
  "exitCode": 1,
  "pagesScanned": 338,
  "pagesSkipped": 2,
  "totalViolations": 1240,
  "totalPatterns": 12,
  "criticalPatterns": 3,
  "seriousPatterns": 5,
  "reportFiles": [
    "./reports/aria-report-2026-03-06-1432.json"
  ]
}
```

### `--threshold <n>`
Only exit with code 1 if total violations exceed `n`. Useful for "warn but don't fail" CI stages.

```bash
a11yscan --sitemap https://... --ci --threshold 100
# exits 0 if violations <= 100, exits 1 if violations > 100
```

### `--min-impact <level>`
Only report (and count toward exit code) violations at or above this impact level.

```bash
a11yscan --sitemap https://... --ci --min-impact serious
# Only critical + serious violations affect exit code
```

---

## Phase 4 Testing Checklist

- [ ] `--engine puppeteer` works when puppeteer is installed
- [ ] `--engine playwright` works when playwright is installed
- [ ] Engine auto-detection uses Playwright when both installed
- [ ] Engine auto-detection falls back to Puppeteer when Playwright not installed
- [ ] Clear error message when neither engine is available
- [ ] `--wait-for-selector ".v-app"` delays scan until element appears
- [ ] `--wait-timeout 5000` correctly times out and skips the page
- [ ] `--full-wcag` enables all axe-core rules and produces broader results
- [ ] `--ignore-rules color-contrast` suppresses that rule from results
- [ ] `--ci` outputs JSON summary to stdout only
- [ ] `--ci` exits 1 on violations
- [ ] `--ci` exits 0 on no violations
- [ ] `--threshold 100` correctly modifies exit code logic
- [ ] `--min-impact serious` excludes moderate/minor from counts and reports
- [ ] All Phase 1–3 tests still pass
