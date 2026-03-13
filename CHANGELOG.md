# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.1] — 2026-03-13

### Changed

#### Web
- **Open-source commitment section** — new homepage section: "Free and open source. Forever." with four pillars (no pricing tiers, no accounts, self-hosted, MIT license)
- **Hero badge** — updated to "100% open source · free forever · MIT license"
- **Interactive wizard documentation** — docs page now has side-by-side "Two ways to scan" cards comparing direct mode and interactive wizard with terminal preview
- **Features page** — expanded interactive wizard description
- **Homepage** — "Zero Config" feature card renamed to "Direct or Interactive" to surface both scan modes

#### CLI
- **README** — added "Two ways to scan" section, open-source commitment language in project description

## [1.5.0] — 2026-03-13

### Changed

#### CLI
- **Redesigned HTML report** — collapsible violation groups with color-coded impact borders, jump-nav table of contents, and severity-sorted layout (critical/serious auto-expanded, moderate/minor collapsed)
- **Summary dashboard** — top-of-report card grid showing counts for critical, serious, moderate, and minor patterns at a glance
- **Collapsible rule reference** — the 96-rule reference table is now collapsed by default to reduce visual noise
- **Collapsible skipped URLs** — skipped URL section collapsed by default
- **Fixed rule reference links** — Deque University links now use correct `4.10` version path (previously `4.x`, which returned 404)

## [1.4.0] — 2026-03-13

### Changed

#### CLI
- **Expanded axe-core rule set from 13 to 96 rules** — the most thorough open-source axe-core scan possible:
  - ARIA roles and attributes (24 rules)
  - Accessible names and labels (18 rules)
  - Color contrast and link distinguishability (2 rules)
  - Document structure: lang, title, heading order, bypass (10 rules)
  - Landmarks and regions: main, banner, contentinfo, skip link (11 rules)
  - Lists and definition lists (4 rules)
  - Tables: headers, captions, data cells, scope (6 rules)
  - Forms: autocomplete, labels, accesskeys, tabindex (4 rules)
  - Interactive elements: nesting, focus, scrollable regions, presentation role (4 rules)
  - Media: audio/video captions, autoplay (3 rules)
  - Visual: viewport zoom, orientation lock, inline spacing, blink/marquee, meta-refresh, target size (9 rules)
- Includes all WCAG 2.1 AA rules plus all axe-core best-practice rules for maximum coverage
- Previously only scanned for ARIA roles, accessible names, and color contrast

## [1.3.0] — 2026-03-13

### Added

#### CLI
- **Interactive wizard** — run `a11yscan` with no arguments to walk through site URL, sitemap location, include/exclude paths, output formats, concurrency, and report retention
- **Report auto-pruning** — `--keep <n>` flag (default: 3) automatically removes old report runs after each scan, keeping the latest N per site/section
- **`prune` subcommand** — manually prune old reports:
  - `a11yscan prune` — list all sites with report counts
  - `a11yscan prune <site>` — prune a specific site
  - `a11yscan prune <site> --section /about` — prune a specific section
  - `a11yscan prune --all` — prune all sites at once
  - `--keep <n>` — control how many runs to retain (default: 3)
- **`DEFAULT_KEEP_REPORTS`** config value in `a11y.config.ts`

### Changed

#### Web
- Hero and comparison card numbers updated from 2,745 to 4,200 to match OG image screenshot

## [1.2.0] — 2026-03-13

### Added

#### CLI
- **Section URL scanning** — include a path in the URL to auto-filter: `a11yscan example.com/about` discovers the sitemap at the site root and filters to `/about`
- **Section-specific report directories** — section scans save to `reports/{hostname}/{section}/{timestamp}/` for easy diffing between runs
- **Increased default concurrency** — default parallel page scanning raised from 4 to 5

#### Web
- **Scroll-to-top button** — fixed-position button appears after 300px scroll, fully WCAG AA accessible with keyboard support and aria-label
- **Navbar scroll-to-top** — clicking the navbar title smoothly scrolls to the top of the page

### Changed

#### CLI
- `DEFAULT_CONCURRENCY` in `a11y.config.ts` changed from 4 to 5
- `resolveSitemapUrl()` always discovers sitemap at site root, even when URL includes a path

#### Web
- Features page updated with section URL scanning description
- Documentation page updated with section URL examples
- README updated with section URL documentation, section-specific report directory examples

## [1.1.1] — 2026-03-13

### Fixed

#### Web
- **Color contrast failures** — replaced `text-neutral-500` and `dark:text-neutral-600` with WCAG AA-compliant `dark:text-neutral-400` across all pages and footer (contrast ratio 5.73:1 on neutral-950, up from 2.29–4.12:1)
- **Heading order** — changed footer `h4` elements to `p` tags to avoid skipping heading levels
- **SEO** — added `og:image:alt`, `twitter:image:alt`, JSON-LD `datePublished`/`dateModified`/`softwareVersion`, `robots.txt`, `sitemap.xml`, `llms.txt`, `favicon.ico`, `apple-touch-icon.png`, and per-page `useSeoMeta` with canonical URLs

## [1.1.0] — 2026-03-13

### Added

#### CLI
- **Markdown reporter** — GitHub-flavored Markdown output for issues and PRs (`--output md`)
- **Pattern grouping** — all reports (CSV, JSON, HTML, Markdown) now group violations by pattern type
- **Timestamped report folders** — each scan preserved in `reports/{hostname}/{timestamp}/` for diffing and trend analysis
- **HTML Snippet and Failure Summary columns** in CSV reports (11 columns, up from 9)
- **`patternGroups`** array in JSON reports with per-violation-type aggregation
- **HTML report grouped sections** — violations organized under collapsible violation-type headings with impact badges
- **axe-core rule: `aria-prohibited-attr`** — detects prohibited ARIA attributes
- **35 new tests** — HTML reporter, Markdown reporter, axe config, pattern grouping, and `prepareSiteReportsDir`

#### Web
- **WCAG 2.1 AA compliance** — skip-to-content link, mobile hamburger menu, focus-visible styles, aria-labels, table captions
- **Light/dark mode** — all pages and components support both modes via Tailwind `dark:` variants
- **System requirements** and **building from source** sections in documentation
- **Chromium dependency instructions** for Ubuntu, macOS, and CI/CD
- **33 web tests** — page rendering, component structure, and accessibility (vitest + happy-dom)
- **Error page** (`error.vue`) with styled 404 handling
- **Nuxt UI upgraded** from 3.1.3 to 4.5.1

### Changed

#### CLI
- CSV column order now leads with `Violation Type` instead of `Pattern ID`
- CSV rows sorted by violation type first, then affected page count descending
- JSON `prepareSiteReportsDir()` creates timestamped subdirectories instead of deleting previous reports
- `VALID_OUTPUT_FORMATS` in `a11y.config.ts` now includes `'md'`
- `CSV_COLUMNS` in `a11y.config.ts` updated to match 11-column output

#### Web
- Roadmap page shows Phase 2 and Phase 5 as "In Progress" with yellow badges
- Documentation page replaces cloud deployment instructions with local install guides
- Features page updated with pattern grouping descriptions and Markdown reporter
- Nuxt dev server uses memory-based cache driver to fix `_payload.json` 500 errors

### Fixed
- `_payload.json` ENOTDIR errors caused by Nitro file-based cache collision
- `pnpm build` filter referenced `cli` instead of package name `a11yscan`
- Test parallelism race condition — each reporter test file now uses its own subdirectory

## [1.0.0] — 2026-03-12

### Added

#### CLI
- Sitemap fetching with SSRF protection and retry logic
- URL filtering: prefix, glob (picomatch), exclude, depth, limit
- Bare URL mode with auto-sitemap discovery (`a11yscan example.com`)
- Playwright scanner with AxeBuilder API and p-limit concurrency (default 4)
- Browser crash recovery with automatic Chromium relaunch
- Pattern analysis: violations grouped by axe-core rule ID + normalized CSS selector
- Root cause hints for Vuetify, Nuxt, WordPress, Material UI, Shopify, Elementor, and more
- CSV, JSON, and HTML reporters
- LLM-ready JSON with `htmlSnippet`, `failureSummary`, `rawSelector`, `suggestedFix`
- Per-site report subfolders
- SIGINT handling with partial report writing
- CI/CD mode (`--ci`) with machine-readable JSON output and exit codes
- `a11y.config.ts` single source of truth for all configuration
- 79 unit tests across all CLI modules

#### Web
- Nuxt 4 + Nuxt UI static marketing site
- Deployed to Netlify via `pnpm generate`
- Pages: home, features, documentation, roadmap
- Netlify configuration for pnpm monorepo deployment

[1.5.1]: https://github.com/ICJIA/a11yscan/compare/v1.5.0...v1.5.1
[1.5.0]: https://github.com/ICJIA/a11yscan/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/ICJIA/a11yscan/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/ICJIA/a11yscan/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/ICJIA/a11yscan/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/ICJIA/a11yscan/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/ICJIA/a11yscan/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/ICJIA/a11yscan/releases/tag/v1.0.0
