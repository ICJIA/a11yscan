# a11yscan — Master Design Document
**Doc 00 of 12**
Version 1.0 | March 2026

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Non-Goals](#3-goals--non-goals)
4. [Architecture Overview](#4-architecture-overview)
5. [Repository Structure](#5-repository-structure)
6. [Tech Stack](#6-tech-stack)
7. [Platform Support](#7-platform-support)
8. [Operating Modes](#8-operating-modes)
9. [Audit Scope](#9-audit-scope)
10. [Output Formats](#10-output-formats)
11. [Marketing Site](#11-marketing-site)
12. [Document Suite Index](#12-document-suite-index)

---

## 1. Project Overview

**a11yscan** is a Node.js command-line tool that audits websites for ARIA role violations, missing labels/names, and color contrast failures using axe-core. It is designed for web teams managing large multi-page or SPA-based sites under ADA Title II compliance deadlines.

The tool operates in two modes:
- **Direct mode** — full flag-based CLI for power users, CI/CD pipelines, and scripting
- **Interactive mode** — a guided wizard (invoked with no arguments) that builds and displays the full command before executing, and optionally saves named profiles for reuse

Results are grouped by **violation pattern**, not by page. A single Vuetify `v-autocomplete` generating a bad `role="listbox"` on 340 pages is reported as one pattern with 340 affected URLs — not 340 separate violations. This transforms a 1,860-page audit into a 12-pattern remediation list.

---

## 2. Problem Statement

State agency web teams managing large Strapi/Vue/Nuxt-based sites face ADA Title II federal accessibility compliance deadlines (April 24, 2026 for many agencies). General-purpose accessibility scanners produce per-page violation dumps that are difficult to act on at scale.

The core challenge:
- Sites with 1,000–2,000+ pages can generate tens of thousands of axe-core findings
- Many violations share a single root cause (a UI framework component, a CMS template, a shared layout)
- Fixing the root cause once resolves all instances — but only if you can identify the pattern
- Compliance officers need shareable, auditable reports — not raw JSON dumps
- Teams need to audit *sections* of a site independently (e.g., `/research` before `/news`)

**a11yscan** solves this by adding a pattern-intelligence layer on top of axe-core, combined with flexible sitemap filtering and multiple report formats.

---

## 3. Goals & Non-Goals

### Goals
- Crawl any website via `sitemap.xml` (including nested sitemaps)
- Fully render JavaScript SPAs before scanning (Playwright default; Puppeteer optional)
- Detect and report: invalid/misused ARIA roles, missing accessible names/labels, color contrast failures
- Group violations by pattern (DOM selector + violation type) across all scanned pages
- Filter sitemaps by path prefix, glob pattern (`--filter-glob`), exclusion list, depth, and page count cap
- Output reports in CSV, JSON, HTML, and Markdown
- Save reports to `./reports/` relative to working directory
- Interactive wizard mode with sensible defaults and assembled-command preview
- Named profile save/load for reuse
- CI/CD friendly (non-zero exit code on violations, `--ci` flag for machine output)
- Cross-platform: macOS (latest), Linux (Ubuntu recommended), Windows via WSL2 only

### Non-Goals
- Full WCAG 2.1 AA audit (this is a focused tool, not a replacement for full auditors)
- PDF accessibility auditing (separate tool concern)
- Authenticated/login-gated page scanning (Phase 1 scope exclusion)
- GUI or browser extension
- Windows native support (WSL2 required)
- Auto-remediation or code patching

---

## 4. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    CLI Entry Point                       │
│         a11yscan [flags] | (no args = wizard)    │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────▼────────────┐
        │     Mode Resolver       │
        │  direct | interactive   │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │    Config Builder       │
        │  flags | wizard | profile│
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │    Sitemap Fetcher      │
        │  fetch + parse XML      │
        │  nested sitemap support │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │    URL Filter Engine    │
        │  prefix | glob | exclude│
        │  depth | limit          │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │    Page Scanner         │
        │  Playwright (default)   │
        │  Puppeteer (--engine)   │
        │  SPA full render wait   │
        │  axe-core injection     │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │    Pattern Analyzer     │
        │  group by selector+type │
        │  frequency count        │
        │  root cause hints       │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │    Report Generator     │
        │  CSV | JSON | HTML | MD │
        │  ./reports/ output dir  │
        └─────────────────────────┘
```

---

## 5. Repository Structure

```
a11yscan/
├── packages/
│   ├── cli/                        # Core CLI tool
│   │   ├── src/
│   │   │   ├── index.ts            # Entry point
│   │   │   ├── cli/
│   │   │   │   ├── direct.ts       # Flag parsing (commander)
│   │   │   │   ├── wizard.ts       # Interactive mode (inquirer)
│   │   │   │   └── profiles.ts     # Profile save/load
│   │   │   ├── sitemap/
│   │   │   │   ├── fetcher.ts      # Fetch + parse sitemap XML
│   │   │   │   └── filter.ts       # URL filtering engine
│   │   │   ├── scanner/
│   │   │   │   ├── playwright.ts   # Playwright page scanner
│   │   │   │   ├── puppeteer.ts    # Puppeteer page scanner
│   │   │   │   └── axe.ts          # axe-core injection + result parsing
│   │   │   ├── analyzer/
│   │   │   │   └── patterns.ts     # Violation pattern grouping
│   │   │   └── reporter/
│   │   │       ├── csv.ts
│   │   │       ├── json.ts
│   │   │       ├── html.ts
│   │   │       └── markdown.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                        # Marketing site (Nuxt 4 + Nuxt UI)
│       ├── app/
│       │   ├── app.vue
│       │   ├── pages/
│       │   │   └── index.vue       # Single-page marketing site
│       │   └── components/
│       ├── public/
│       ├── nuxt.config.ts
│       └── package.json
│
├── docs/                           # This design suite (13 docs)
├── profiles/                       # Saved audit profiles (gitignored)
├── reports/                        # Default report output (gitignored)
├── pnpm-workspace.yaml
├── package.json
├── .nvmrc                          # Pins Node.js to v20 (LTS)
├── .npmrc                          # pnpm settings: shamefully-hoist=false
├── .gitignore                      # See Section 5a below
└── README.md
```

### 5a. Root Config Files

**`.nvmrc`**
```
20
```

**`.npmrc`**
```
shamefully-hoist=false
strict-peer-dependencies=false
```

**`.gitignore`**
```
# Dependencies
node_modules/

# Build output
packages/cli/dist/
packages/web/.output/
packages/web/.nuxt/

# Reports and profiles (user-generated, not committed)
reports/
profiles/

# Environment
.env
.env.*
!.env.example

# OS
.DS_Store
Thumbs.db

# Editor
.vscode/
.idea/
*.swp

# Logs
*.log
npm-debug.log*
pnpm-debug.log*

# Playwright
packages/cli/test-results/
packages/cli/playwright-report/
```

---

## 6. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Language | TypeScript | Strict mode |
| Package manager | pnpm | Workspaces monorepo — **required**, do not substitute npm or yarn |
| Node.js | 20 (LTS) | Pinned via `.nvmrc` at repo root |
| CLI framework | commander | Flag parsing, help generation |
| Wizard/prompts | inquirer | Interactive mode |
| Headless browser | Playwright | Default; Puppeteer optional via `--engine puppeteer` |
| Accessibility engine | axe-core | Via `@axe-core/playwright` or `axe-core` injection |
| Sitemap parsing | sitemapper | Handles nested sitemaps |
| Report templating | Handlebars | HTML report template |
| Progress display | ora + cli-progress | Spinner + progress bar |
| Logging | chalk | Colored terminal output |
| Config/profiles | conf | XDG-compliant profile storage |
| Marketing site | Nuxt **4.4.2** + Nuxt UI **4.5.1** | Dark mode only, Netlify deploy |
| Marketing deploy | Netlify | Static via `pnpm generate`, auto-deploy from main branch |

> **Tailwind CSS note:** Nuxt UI 4.x bundles Tailwind CSS v4 internally. Do **not** install `@nuxtjs/tailwindcss` separately. CSS is wired via `~/assets/css/main.css` using `@import "tailwindcss"` and `@import "@nuxt/ui"` directives. No `tailwind.config.js` file is needed.

---

## 7. Platform Support

| Platform | Support | Notes |
|---|---|---|
| macOS (latest) | ✅ Full | Primary development platform |
| Linux (Ubuntu 22.04+) | ✅ Full | Recommended for CI/CD |
| Windows (WSL2) | ✅ Supported | Must have WSL2 + Ubuntu distro installed |
| Windows (native) | ❌ Not supported | WSL2 required; document clearly in README |

### WSL2 Requirements
- WSL2 enabled (not WSL1)
- Ubuntu 22.04 or 24.04 distro installed
- Node.js 20+ installed inside WSL2 (not Windows Node)
- Playwright browser binaries installed inside WSL2 environment
- All commands run from WSL2 terminal, not Windows Command Prompt or PowerShell

---

## 8. Operating Modes

### Direct Mode
Full flag syntax for scripting and CI/CD:

```bash
a11yscan \
  --sitemap https://icjia.illinois.gov/sitemap.xml \
  --filter "/research" \
  --exclude "/research/archive" \
  --depth 3 \
  --limit 100 \
  --engine playwright \
  --output csv,json,html \
  --filename research-audit \
  --ci
```

### Interactive Mode (Wizard)
Invoked with no arguments:

```bash
a11yscan
```

Presents a step-by-step questionnaire with sensible defaults shown inline. Assembles and displays the full CLI command before executing. Optionally saves as a named profile.

### Profile Mode
Run a saved configuration:

```bash
a11yscan --profile research-section
a11yscan --profile research-section --limit 50   # override one flag
```

### CI Mode
Machine-friendly output, non-zero exit on violations:

```bash
a11yscan --sitemap ... --ci
# exits 0 = no violations, exits 1 = violations found
```

---

## 9. Audit Scope

axe-core rule sets enabled by default:

| Category | Rules |
|---|---|
| ARIA Roles | `aria-allowed-role`, `aria-required-children`, `aria-required-parent`, `aria-roles`, `aria-prohibited-attr` |
| Accessible Names | `aria-label`, `button-name`, `input-button-name`, `image-alt`, `label`, `link-name` |
| Color Contrast | `color-contrast`, `color-contrast-enhanced` |

All other axe-core rules are **disabled** by default to keep the tool focused. A future `--full-wcag` flag (Phase 3+) can enable the complete rule set.

### Pattern Grouping Logic
Violations are grouped by: `violation_id + css_selector_normalized`. Pages sharing the same selector/violation pair are aggregated under one pattern entry. Report shows:
- Pattern ID (auto-generated)
- Violation type and description
- Normalized CSS selector
- Affected URL count
- All affected URLs (expandable in HTML report)
- Suggested fix
- Likely root cause hint (e.g., "Vuetify v-autocomplete", "shared nav component")

---

## 10. Output Formats

All reports saved to `./reports/` by default. Filename uses `--filename` flag or defaults to `aria-report-{timestamp}`.

| Format | File | Use case |
|---|---|---|
| CSV | `{name}.csv` | Spreadsheet triage, Excel import |
| JSON | `{name}.json` | Machine processing, CI/CD integration |
| HTML | `{name}.html` | Shareable compliance report, management review |
| Markdown | `{name}.md` | GitHub/Notion posting, documentation |

HTML report features:
- Dark/light mode toggle
- Collapsible pattern sections
- Affected URL list per pattern
- Summary statistics header
- Print-friendly stylesheet

---

## 11. Marketing Site

A single-page **Nuxt 4.4.2** + **Nuxt UI 4.5.1** marketing site lives at `packages/web/`. It is:
- **Dark mode only** — no light mode toggle
- **Single page** — no routing, no dynamic functionality
- **Static/SSR** — deployed to Netlify from the monorepo
- **Modern and sleek** — built after Phase 1 CLI is complete

Content covers: tool description, key features, installation instructions, CLI flag reference, example output screenshots, platform requirements (WSL2 callout), and a link to the GitHub repo.

Netlify deployment uses `packages/web/` as the publish directory with `pnpm build` in the `packages/web` context.

---

## 12. Document Suite Index

| Doc | Title | Status |
|---|---|---|
| **00** | Master Design (this doc) | ✅ Complete |
| **01** | Phase 1 — Core CLI: sitemap fetch, filter (prefix + glob), Playwright scan, concurrency, pattern grouping, CSV/JSON output, unit tests | 📋 Spec |
| **02** | Phase 2 — Output Formats: HTML report, Markdown report, ora progress display | 📋 Spec |
| **03** | Phase 3 — Interactive Wizard: inquirer prompts, assembled-command preview, profile save/load | 📋 Spec |
| **04** | Phase 4 — Puppeteer engine option, CI mode, `--full-wcag` flag, concurrency tuning | 📋 Spec |
| **05** | Phase 5 — Marketing Site: Nuxt 4 + Nuxt UI, dark mode, Netlify deploy | 📋 Spec |
| **06** | Security | 📋 Spec |
| **07** | LLM Build Prompt | 📋 Spec |
| **08** | Differentiation | 📋 Spec |
| **09** | Monorepo & Marketing Site Architecture | 📋 Spec |
| **10** | Revision & Gap Analysis | 📋 Spec |
| **11** | Architecture Decisions | 📋 Spec |
| **12** | Use Cases | 📋 Spec |
