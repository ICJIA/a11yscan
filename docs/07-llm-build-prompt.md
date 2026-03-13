# a11yscan — LLM Build Prompt
**Doc 07 of 12**
Version 1.0 | March 2026

> **Usage:** Feed the relevant phase section of this document to an LLM to build that phase. Each phase section is fully self-contained — no other docs are required. Always specify which phase you are building.

---

## Static Context (All Phases)

```
You are an expert Node.js/TypeScript developer building a CLI accessibility auditing 
tool called "a11yscan" (marketing domain: a11yscan.dev). You write clean, 
strict TypeScript with proper error handling. You never use any deprecated APIs. 
You always handle async errors with try/catch. You write code that runs correctly 
on macOS, Ubuntu Linux, and Windows WSL2.

TECH STACK (non-negotiable, all versions pinned):
- Language: TypeScript (strict mode, no implicit any)
- Package manager: pnpm 9.x — required, never substitute npm or yarn
- Node.js: 20 LTS — pinned via .nvmrc containing "20"
- Monorepo structure: packages/cli (CLI tool), packages/web (marketing site)
- CLI framework: commander@12.x
- Wizard/prompts: inquirer@9.x (ESM-compatible)
- Headless browser: Playwright (default), Puppeteer (optional)
- Accessibility engine: @axe-core/playwright (uses AxeBuilder API — do NOT manually inject axe-core via addScriptTag)
- Sitemap parsing: sitemapper@3.x
- Progress: ora@8.x + cli-progress@3.x
- Colors: chalk@5.x (ESM-compatible)
- Profile storage: conf@13.x
- HTML templates: Handlebars@4.x
- Concurrency: p-limit@6.x
- Glob matching: picomatch@4.x
- Testing: vitest@3.x
- Marketing site: Nuxt 4.4.2 + Nuxt UI 4.5.1

NUXT UI CSS INTEGRATION (critical — do not deviate):
- Nuxt UI 4.x bundles Tailwind CSS v4 internally
- Do NOT install @nuxtjs/tailwindcss — it is not needed and will conflict
- Do NOT create tailwind.config.js — not used in Tailwind v4
- CSS entry file: packages/web/app/assets/css/main.css
- CSS entry file must contain:
    @import "tailwindcss";
    @import "@nuxt/ui";
- nuxt.config.ts must include: css: ['~/assets/css/main.css']
- Custom theme tokens go in main.css using @theme { } directive
- Runtime color config goes in app.config.ts under ui.colors

REPOSITORY STRUCTURE (full final structure — each phase only builds its own files):
a11yscan/
├── packages/
│   ├── cli/                        # Phases 1–4
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── cli/
│   │   │   │   ├── direct.ts       # Phase 1
│   │   │   │   ├── wizard.ts       # Phase 3 (do NOT create in Phase 1)
│   │   │   │   └── profiles.ts     # Phase 3 (do NOT create in Phase 1)
│   │   │   ├── sitemap/
│   │   │   │   ├── fetcher.ts
│   │   │   │   └── filter.ts
│   │   │   ├── scanner/
│   │   │   │   ├── playwright.ts
│   │   │   │   ├── puppeteer.ts    # Phase 4 (do NOT create in Phase 1)
│   │   │   │   └── axe.ts
│   │   │   ├── analyzer/
│   │   │   │   └── patterns.ts
│   │   │   └── reporter/
│   │   │       ├── csv.ts
│   │   │       ├── json.ts
│   │   │       ├── html.ts         # Phase 2 (do NOT create in Phase 1)
│   │   │       ├── markdown.ts     # Phase 2 (do NOT create in Phase 1)
│   │   │       └── templates/
│   │   │           └── report.hbs  # Phase 2 (do NOT create in Phase 1)
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/                        # Phase 5 (do NOT create in Phase 1)
│       ├── app/
│       │   ├── assets/css/main.css
│       │   ├── app.vue
│       │   ├── app.config.ts
│       │   └── pages/index.vue
│       ├── nuxt.config.ts
│       └── package.json
├── docs/
├── pnpm-workspace.yaml
├── package.json
├── .nvmrc                          # Contains: 20
├── .npmrc                          # pnpm config
├── .gitignore
└── README.md

ESM CONFIGURATION (critical for chalk@5, p-limit@6, ora@8):
- packages/cli/package.json MUST include: "type": "module"
- tsconfig.json: "module": "NodeNext", "moduleResolution": "NodeNext"
- All local imports MUST use .js extension: import { foo } from './bar.js'

SECURITY RULES (enforce in all generated code):
1. Never allow file paths in --filename that contain / \ .. or special chars
2. Never scan localhost, 127.0.0.1, 192.168.x.x, 10.x.x.x, or 169.254.x.x URLs
3. Always escape user-derived content in HTML report templates
4. Never disable Playwright/Puppeteer sandbox
5. All dependencies pinned to exact versions (no ^ or ~)

AXE-CORE RULES ENABLED BY DEFAULT:
- aria-allowed-role, aria-required-children, aria-required-parent, aria-roles, aria-prohibited-attr
- aria-label, button-name, input-button-name, image-alt, label, link-name
- color-contrast, color-contrast-enhanced
All other axe-core rules are DISABLED by default.

SPA RENDER STRATEGY (both engines):
1. Navigate to URL
2. Wait for networkidle (no network activity for 500ms)
3. If --wait-for-selector provided: additionally wait for that selector
4. 500ms fixed delay after networkidle as safety buffer
5. Then run axe-core via @axe-core/playwright AxeBuilder API

PATTERN GROUPING KEY: `${violationId}::${normalizeSelector(cssSelector)}`
Selector normalization: strip :nth-child(), strip inline style attrs, lowercase.

OUTPUT: All reports saved to ./reports/ relative to CWD. Auto-create if missing.
Default filename: aria-report-{YYYY-MM-DD-HHmm}
```

---

## Phase 1 Build Prompt

```
Using the static context above, build Phase 1 of a11yscan.

PHASE 1 DELIVERABLE:
A working CLI that: fetches a sitemap, filters URLs, scans pages with Playwright, 
runs axe-core, groups violations by pattern, and outputs CSV and JSON reports.

WHAT TO BUILD (in this order):

1. MONOREPO SCAFFOLD
   - Root package.json with pnpm workspaces
   - pnpm-workspace.yaml pointing to packages/*
   - .nvmrc at repo root containing exactly: 20
   - .npmrc at repo root containing:
       shamefully-hoist=false
       strict-peer-dependencies=false
   - .gitignore at repo root covering:
       node_modules/, packages/cli/dist/, packages/web/.output/,
       packages/web/.nuxt/, reports/, profiles/, .env, .env.*,
       !.env.example, .DS_Store, *.log, pnpm-debug.log*,
       packages/cli/test-results/, packages/cli/playwright-report/
   - packages/cli/package.json MUST include "type": "module" (required for ESM imports)
   - packages/cli/package.json dependencies (exact versions, no ^ or ~):
     - commander@12.1.0
     - sitemapper@3.1.4
     - playwright@1.50.0
     - @axe-core/playwright@4.10.0
     - chalk@5.3.0
     - csv-writer@1.6.0
     - p-limit@6.0.0
     - picomatch@4.0.2
   - packages/cli/package.json devDependencies (exact versions):
     - typescript@5.7.3
     - vitest@3.0.0
     - @types/picomatch@4.0.2
   - packages/cli/tsconfig.json: strict mode, "target": "ESNext", "module": "NodeNext", "moduleResolution": "NodeNext"
   - All local imports must use .js extension (e.g., import { foo } from './bar.js')

2. ENTRY POINT (src/index.ts)
   - Import commander setup from cli/direct.ts
   - If no arguments: print help and exit (wizard comes in Phase 3)
   - Route to direct mode

3. CLI FLAGS (src/cli/direct.ts)
   Implement these flags exactly:
   --sitemap <url>      required
   --filter <path>      optional, default: (all)
   --exclude <paths>    optional, comma-separated
   --depth <n>          optional, number
   --limit <n>          optional, number
   --output <formats>   optional, default: "csv,json"
   --filename <name>    optional, default: "aria-report-{timestamp}"
   --filter-glob <pat>  optional, glob pattern for URL pathname matching (picomatch)
   --concurrency <n>    optional, default: 3, max: 5 — parallel pages via p-limit
   --ci                 boolean flag
   --version            show version from package.json
   --help               auto-generated by commander

4. SITEMAP FETCHER (src/sitemap/fetcher.ts)
   - Use sitemapper to fetch and parse sitemap URL
   - Return string[] of all URLs (sitemapper handles nested sitemaps)
   - Throw with helpful message if sitemap unreachable
   - Validate each URL with isSafeUrl() — skip and warn on unsafe URLs
   
   isSafeUrl() must block: localhost, 127.0.0.1, 0.0.0.0, ::1,
   169.254.x.x, 10.x.x.x, 172.16-31.x.x, 192.168.x.x

5. URL FILTER (src/sitemap/filter.ts)
   Interface:
   filterUrls(urls: string[], options: {
     filter?: string;
     filterGlob?: string;
     exclude?: string[];
     depth?: number;
     limit?: number;
   }): string[]

   - filter: pathname.startsWith(filter)
   - filterGlob: use picomatch to match URL pathname against glob pattern
   - filter + filterGlob combined: URL must match BOTH
   - exclude: drop any URL where pathname.startsWith(excludeItem)
   - exclude parsing: comma-separated string with whitespace trimmed around commas
   - depth: count '/' segments in pathname, drop if > depth
   - limit: slice result to limit after all other filters
   - Log: "Found X URLs → filtered to Y matching {filter}"

6. AXE CONFIG (src/scanner/axe.ts)
   Export AXE_RULES object (list of enabled rule IDs) and buildAxeConfig() function.
   buildAxeConfig() returns an options object compatible with AxeBuilder.options():
   { runOnly: { type: 'rule', values: [...enabledRuleIds] } }
   This enables ONLY the 13 rules listed in static context. All other rules disabled.

7. PLAYWRIGHT SCANNER (src/scanner/playwright.ts)
   Export a ScannerManager class (not bare functions) to manage browser lifecycle:

   class ScannerManager {
     private browser: Browser | null = null;

     async launch(): Promise<void>
       - Launch chromium headless via playwright.chromium.launch()
       - Store browser instance for reuse across all pages

     async scanPage(url: string, axeConfig: object): Promise<AxeResults | null>
       - Create new page from this.browser (reuse browser, new page per URL)
       - Navigate to url with { waitUntil: 'networkidle' }
       - 500ms delay after networkidle as safety buffer
       - Run axe using @axe-core/playwright AxeBuilder API:
           import AxeBuilder from '@axe-core/playwright';
           const results = await new AxeBuilder({ page })
             .options(axeConfig)
             .analyze();
       - Do NOT use addScriptTag or page.evaluate for axe — use AxeBuilder
       - Close the page (not the browser) after scan
       - Return AxeResults on success, null on failure
       - Timeout: 30000ms default per page
       - On timeout or navigation error: return null (caller logs to skippedUrls)

     async close(): Promise<void>
       - Close browser instance

     async relaunch(): Promise<boolean>
       - Attempt to close crashed browser and launch a new one
       - Return true if successful, false if relaunch also fails
   }

   In the caller (index.ts / direct.ts):
   - Create one ScannerManager instance
   - Call manager.launch() once
   - Use p-limit(concurrency) to run manager.scanPage() calls in parallel
   - On browser crash: call manager.relaunch(); if fails, write partial report, exit 3
   - Call manager.close() when all pages are done

8. PATTERN ANALYZER (src/analyzer/patterns.ts)
   Input: Map<url: string, axeResults: AxeResults>
   Output: ViolationPattern[]
   
   ViolationPattern shape:
   {
     patternId: string;          // "P001", "P002"...
     violationId: string;
     violationDescription: string;
     impact: string;
     normalizedSelector: string;
     affectedPageCount: number;
     affectedUrls: string[];
     suggestedFix: string;       // axe helpUrl
     rootCauseHint: string;
   }
   
   Root cause hints (use CSS selector pattern matching, not substring):
   - selector matches .v- class prefix (Vuetify pattern) → "Likely Vuetify component"
   - selector matches .__nuxt or .nuxt- or #__nuxt → "Likely Nuxt layout element"
   - selector matches <nav>, <header>, <footer>, or role=navigation/banner/contentinfo → "Likely shared layout component"
   - appears on >50% of scanned pages → "Global component or template"
   - default → "Component-level issue"
   
   Sort output by affectedPageCount descending.

9. CSV REPORTER (src/reporter/csv.ts)
   Columns (in order):
   Pattern ID, Violation ID, Impact, Description, Selector, 
   Affected Pages, Root Cause Hint, Suggested Fix URL, 
   Affected URLs (pipe-separated)
   
   Use csv-writer package. Save to ./reports/{filename}.csv
   Auto-create ./reports/ if missing.

10. JSON REPORTER (src/reporter/json.ts)
    Shape:
    {
      meta: {
        generatedAt: string,      // ISO timestamp
        sitemap: string,
        filter: string | null,
        pagesScanned: number,
        pagesSkipped: number,
        totalViolations: number,  // sum of all pattern affectedPageCounts
        totalPatterns: number,
        tool: "a11yscan",
        version: string
      },
      patterns: ViolationPattern[],
      skippedUrls: { url: string, reason: string }[]
    }
    Save to ./reports/{filename}.json

11. TERMINAL OUTPUT (in index.ts / direct.ts)
    Use chalk for color. Non-CI mode only.
    - Before scan: "a11yscan v{version}"
    - After sitemap fetch: "Fetching sitemap... {n} URLs found"
    - After filter: "Applying filters... {n} URLs matched {filter}"
    - During scan: "[{current}/{total}] {url}" (simple counter, no progress bar yet)
    - After scan: summary block as shown in Doc 01
    
    CI mode (--ci): suppress all above. Only emit JSON summary to stdout on completion.

    EXIT CODES:
    0 = scan complete, no violations found
    1 = scan complete, violations found
    2 = configuration or fetch error (bad sitemap URL, invalid flags, unreachable sitemap)
    3 = scan interrupted (browser crash after relaunch failure, partial results written)

12. ERROR RECOVERY
    - Sitemap fetch: retry once after 5s on failure, then exit code 2
    - Per-page timeout/error: skip page, log to skippedUrls
    - Browser crash: attempt browser relaunch once; if fails, write partial report, exit 3
    - SIGINT: write partial report with "interrupted": true in JSON meta, exit 3
    - Partial reports include all results collected so far

13. UNIT TESTS (src/**/*.test.ts via vitest)
    Required test files:
    - src/sitemap/filter.test.ts: prefix, glob, exclude (with whitespace), depth, limit, combined
    - src/sitemap/fetcher.test.ts: isSafeUrl() blocks all private IPs, allows public URLs
    - src/analyzer/patterns.test.ts: selector normalization, grouping, root cause hints
    - src/reporter/csv.test.ts: valid CSV structure, correct columns
    - src/reporter/json.test.ts: valid JSON, filename sanitization

14. README.md
    Include:
    - What the tool does (2 paragraphs)
    - Installation: macOS, Linux (Ubuntu), Windows WSL2 — use pnpm as primary install method
    - WSL2 requirements section
    - Basic usage examples
    - All Phase 1 flags with descriptions
    - Platform support table

OUTPUT: Provide all files with complete implementations. No stubs. No TODOs.
After providing code, provide the exact pnpm commands to install, build, run
unit tests, and run a smoke test scan against
https://www.w3.org/WAI/demos/bad/after/home.html
(this is a publicly available accessibility demo page).
```

---

## Phase 2 Build Prompt

```
Using the static context above, add Phase 2 features to a11yscan.
Assume Phase 1 is complete and working. Do not rewrite Phase 1 code unless 
fixing a bug. Add only what is specified below.

WHAT TO ADD:

1. HTML REPORTER (src/reporter/html.ts + src/reporter/templates/report.hbs)
   - Self-contained single HTML file (no external dependencies)
   - Use Handlebars to render report.hbs template
   - Inline all CSS and the minimal dark-mode-toggle JS
   - Dark mode default, light mode toggle (localStorage persistence)
   - Collapsible patterns via <details>/<summary>
   - Impact badge colors: critical=#ef4444, serious=#f97316, moderate=#eab308, minor=#6b7280
   - Print stylesheet: expand all, black/white safe
   - Escape ALL user-derived content (Handlebars does this by default — verify)
   - CSP meta tag (see Doc 06 for value)
   - All axe helpUrl <a> tags: target="_blank" rel="noopener noreferrer"
   - Save to ./reports/{filename}.html

2. MARKDOWN REPORTER (src/reporter/markdown.ts)
   - GitHub and Notion compatible
   - Use <details>/<summary> for affected URL lists (GitHub renders this)
   - Structure per Doc 02 spec
   - Save to ./reports/{filename}.md

3. ORA SPINNER
   Add ora to package.json (exact version).
   Replace chalk text lines with ora spinners:
   - "Fetching sitemap..." → ora spinner → succeed with URL count
   - "Applying filters..." → ora spinner → succeed with filtered count

4. CLI-PROGRESS BAR
   Add cli-progress to package.json.
   Replace "[{current}/{total}] {url}" with a progress bar:
   Format: ████████████░░░░░░░░░░ 156/340 (45%) — ETA 2m 14s
   Update on each page completion.
   Hide in --ci mode.

5. --quiet FLAG
   Suppress all output except errors and final summary line.

6. FILENAME TIMESTAMP FORMAT
   Change to YYYY-MM-DD-HHmm format.

OUTPUT: Provide changed/new files only. Specify which files are new vs modified.
```

---

## Phase 3 Build Prompt

```
Using the static context above, add Phase 3 (Interactive Wizard + Profiles) 
to a11yscan. Assume Phases 1–2 are complete.

WHAT TO ADD:

1. WIZARD (src/cli/wizard.ts)
   Add inquirer to package.json (v9+, ESM-compatible).
   
   Trigger: if process.argv.length === 2 (no arguments)
   
   Questions in order (with defaults):
   1. Sitemap URL [no default — required]
   2. Filter path prefix [blank = all pages]
   3. Exclude paths, comma-separated [blank = none]
   4. Max depth [blank = unlimited]
   5. Max pages [blank = unlimited]  
   6. Browser engine: list → Playwright (default) | Puppeteer
   7. Output formats: checkbox → all 4 selected by default
   8. Report filename base [blank = auto-timestamp]
   9. Concurrency 1–5 [default: 3]
   
   After all questions:
   - Assemble the equivalent CLI command string
   - Display it with a separator line above and below
   - Ask: "Save as profile? (y/N)"
   - If y: ask for profile name (validate: lowercase, hyphens, alphanumeric, max 40 chars)
   - Ask: "Run now? (Y/n)"
   - If y: pass assembled config to the same run pipeline as direct mode
   - If n: exit cleanly

2. PROFILES (src/cli/profiles.ts)
   Add conf to package.json.
   
   Implement:
   - saveProfile(name: string, config: AuditConfig): void
   - loadProfile(name: string): AuditConfig | null
   - listProfiles(): { name: string, config: AuditConfig }[]
   - deleteProfile(name: string): void
   
   Add flags to direct.ts:
   --profile <name>         load and run a saved profile
   --save-profile <name>    save current flags as profile without running
   --list-profiles          list all saved profiles and exit
   --delete-profile <name>  delete a saved profile and exit

3. PROFILE FLAG OVERRIDE
   When --profile is used with other flags, the other flags override 
   the profile values for that run (but do not modify the saved profile).

OUTPUT: Provide changed/new files only.
```

---

## Phase 4 Build Prompt

```
Using the static context above, add Phase 4 (Puppeteer engine, advanced flags) 
to a11yscan. Assume Phases 1–3 are complete.

WHAT TO ADD:

1. PUPPETEER SCANNER (src/scanner/puppeteer.ts)
   Add puppeteer as optional peer dependency (not in dependencies — in peerDependencies).
   
   Same interface as playwright.ts:
   async function scanPage(url: string, axeConfig: RunOptions): Promise<AxeResults | null>
   
   SPA render strategy identical to Playwright version.
   Inject axe-core via page.addScriptTag.
   
2. ENGINE RESOLVER (src/scanner/engine-resolver.ts)
   Logic:
   1. If --engine playwright → import playwright scanner (error if package missing)
   2. If --engine puppeteer → import puppeteer scanner (error if package missing)
   3. No --engine flag → try playwright first, then puppeteer, error if neither
   
   Error messages must include install commands.

3. --wait-for-selector <selector>
   After networkidle wait, additionally wait for this CSS selector.
   Applied in both Playwright and Puppeteer scanners.
   Timeout from --wait-timeout.

4. --wait-timeout <ms>
   Per-page timeout. Default: 30000. Applied to all wait operations.

5. --full-wcag FLAG
   When present: enable all axe-core WCAG 2.1 AA rules instead of default 13.
   Update buildAxeConfig() to accept a fullWcag boolean parameter.
   Add note to report meta and HTML report header when --full-wcag was used.

6. --ignore-rules <rules>
   Comma-separated axe rule IDs to exclude from the enabled rule set.
   Applied after --full-wcag (so you can enable all then exclude specific ones).

7. CI MODE HARDENING
   --threshold <n>: exit 1 only if totalViolations > n
   --min-impact <level>: filter violations below this impact level from 
     results AND from exit code calculation
     Valid values: critical, serious, moderate, minor
   
   CI stdout JSON: add threshold and minImpact to output meta.

OUTPUT: Provide changed/new files only.
```

---

## Phase 5 Build Prompt

```
Using the static context above, build the Phase 5 marketing site at packages/web/.

TECH STACK (pinned):
- Nuxt 4.4.2 (package.json: "nuxt": "4.4.2")
- Nuxt UI 4.5.1 (package.json: "@nuxt/ui": "4.5.1")
- pnpm 9.x
- Node.js 20 LTS
- Dark mode ONLY (no toggle, preference: 'dark', fallback: 'dark')
- Single page (no routing)
- Deploy target: Netlify (static generation via `pnpm generate`)

CRITICAL — NUXT UI CSS WIRING (do not deviate):
Nuxt UI 4.x bundles Tailwind CSS v4. Do NOT install @nuxtjs/tailwindcss.
Do NOT create tailwind.config.js.

Create packages/web/app/assets/css/main.css:
  @import "tailwindcss";
  @import "@nuxt/ui";
  @theme {
    --color-bg: #0a0a0a;
    --color-surface: #111111;
    --color-border: #222222;
    --color-accent: #22d3ee;
    --color-secondary: #a78bfa;
    --color-text: #f4f4f5;
    --color-muted: #71717a;
    --color-critical: #ef4444;
    --color-success: #22c55e;
    --font-sans: 'Inter', system-ui, sans-serif;
    --font-mono: 'JetBrains Mono', ui-monospace, monospace;
  }

packages/web/nuxt.config.ts must include:
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  colorMode: { preference: 'dark', fallback: 'dark' }

packages/web/app/app.config.ts:
  export default defineAppConfig({
    ui: { colors: { primary: 'cyan', secondary: 'violet', neutral: 'zinc' } }
  })

COLOR PALETTE (enforce throughout):
- bg: #0a0a0a, surface: #111111, border: #222222
- accent: #22d3ee (cyan), secondary: #a78bfa (violet)
- text: #f4f4f5, muted: #71717a
- critical: #ef4444, success: #22c55e

BUILD THESE SECTIONS (single scrolling page):

1. Hero
   - Name: "a11yscan"
   - Tagline: "Turn 1,860 accessibility violations into 12 patterns."
   - Install command with copy button: pnpm add -g a11yscan
   - GitHub CTA button
   - Animated terminal window (CSS only, no JS) showing wizard interaction

2. The Problem
   - Copy about axe-core at scale
   - Before/after visual: "1,860 violations" → "12 patterns"

3. Features (6-card grid)
   1. Pattern-Aware Grouping
   2. SPA-Ready (Playwright)
   3. Sitemap Filtering
   4. Interactive Wizard
   5. Four Output Formats
   6. CI/CD Ready

4. Installation (Nuxt UI tabs)
   - macOS tab
   - Linux tab  
   - WSL2 tab (include WSL2 requirement warning and link)

5. Usage Examples (3 terminal mockup blocks)
   - Direct mode
   - Wizard mode
   - Profile mode

6. Platform Support table

7. Footer (name, license MIT, GitHub link, axe-core attribution)

NUXT CONFIG:
- Generate static output for Netlify via `pnpm generate`
- SEO meta tags (see Doc 05)
- No analytics, no tracking

NETLIFY CONFIG (netlify.toml at repo root):
- base: packages/web
- command: pnpm generate
- publish: .output/public
- CSP and security headers per Doc 06

The marketing site must itself pass an a11yscan audit — zero violations.

OUTPUT: Complete Nuxt app. All files. Include netlify.toml.
```
