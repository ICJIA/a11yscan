<p align="center">
  <img src="assets/og-image.png" alt="a11yscan — Pattern-aware accessibility auditor" width="100%">
</p>

# a11yscan

A pattern-aware CLI tool that audits websites for ARIA role violations, missing accessible names, and color contrast failures using axe-core. Built for web teams managing large multi-page or SPA-based sites under ADA Title II compliance deadlines.

Instead of dumping thousands of per-page violations, a11yscan groups findings by **pattern** — the combination of violation type and normalized CSS selector. A single Vuetify `v-autocomplete` generating a bad `role="listbox"` on 340 pages is reported as one pattern with 340 affected URLs, not 340 separate violations. This transforms a 1,860-page audit into a 12-pattern remediation list.

## Why a11yscan?

### The problem with traditional accessibility tools

Enterprise accessibility scanners like SiteImprove, WAVE, or Lighthouse generate results per page. A 500-page site with a broken Vuetify autocomplete on every page produces:

> **SiteImprove: "2,745 violations found"**

That's not actionable. A developer staring at 2,745 line items can't tell whether there are 2,745 unique problems or 5 repeated patterns. Most of those violations come from the same handful of components rendered across hundreds of pages.

### What a11yscan does differently

a11yscan groups violations by the *root cause* — the combination of the axe-core rule ID and the CSS selector where it occurs. The same 2,745 violations become:

> **a11yscan: "12 patterns found across 500 pages"**

Each pattern tells you exactly what's broken, where it appears, how many pages it affects, and what framework component is likely responsible. You fix 12 things, not 2,745.

### LLM-ready reports

The JSON report includes everything an LLM needs to generate fixes without human hand-holding:

- **`htmlSnippet`** — the actual DOM element markup that failed
- **`failureSummary`** — axe-core's plain-English fix instructions
- **`rawSelector`** — the full CSS selector path to the element
- **`suggestedFix`** — link to the Deque University fix guide
- **`rootCauseHint`** — which framework component is likely responsible

Feed the JSON to Claude, GPT, or any code-generation LLM and get actionable diffs back.

### User stories

**State agency webmaster with 1,800+ pages and an ADA Title II deadline:**
> "SiteImprove told us we had 4,200 violations. We didn't know where to start. a11yscan showed us it was actually 15 patterns — 8 from Vuetify components and 7 from our custom navigation. We fixed all 15 in two sprints."

**University web team managing a Nuxt/Vue marketing site:**
> "We run `a11yscan --filter /admissions` before every release. It catches new ARIA issues from our component library before they multiply across 200 admissions pages."

**DevOps engineer integrating accessibility into CI/CD:**
> "We use `--ci` mode in our GitHub Actions pipeline. If the scan finds violations, the build fails with a machine-readable JSON summary. No more surprises in production."

**Freelance developer auditing a client's WordPress site:**
> "The root cause hints immediately told me which violations came from the theme vs. which came from plugins. I could give the client a clear, prioritized fix list instead of a 40-page PDF."

## Installation

### macOS / Linux (Ubuntu)

```bash
pnpm add -g a11yscan
npx playwright install chromium
```

### Windows (WSL2 required)

Windows native is not supported. You must use WSL2 with an Ubuntu distro.

```bash
# 1. Enable WSL2 and install Ubuntu from Microsoft Store
#    https://learn.microsoft.com/en-us/windows/wsl/install
# 2. Open Ubuntu terminal:
pnpm add -g a11yscan
npx playwright install chromium
```

#### WSL2 Requirements

- WSL2 enabled (not WSL1)
- Ubuntu 22.04 or 24.04 distro installed
- Node.js 20+ installed inside WSL2 (not Windows Node)
- Playwright browser binaries installed inside WSL2
- All commands run from WSL2 terminal, not Windows Command Prompt or PowerShell

### Shell alias (local development)

If you're running a11yscan from source rather than a global install, add an alias to your shell config so you can call `a11yscan` from anywhere:

**zsh** (add to `~/.zshrc`):
```bash
# a11yscan CLI
alias a11yscan='node /path/to/a11yscan.dev/packages/cli/dist/index.js'
```

**bash** (add to `~/.bashrc`):
```bash
# a11yscan CLI
alias a11yscan='node /path/to/a11yscan.dev/packages/cli/dist/index.js'
```

Replace `/path/to/a11yscan.dev` with the actual path to your clone. Then reload your shell:

```bash
source ~/.zshrc   # or source ~/.bashrc
```

## Usage

### Basic scan — just give it a URL

a11yscan automatically looks for `/sitemap.xml` at the site root. No flags needed. Protocol is optional — `https://` is auto-prepended if missing:

```bash
a11yscan r3.illinois.gov
```

If the sitemap isn't at the root, specify it directly:

```bash
a11yscan --sitemap https://example.com/custom-path/sitemap.xml
```

### Scan only a specific section (prefix filter)

Use `--filter` to scan only pages whose URL path starts with a given prefix. This is the fastest way to audit a single section of a large site:

```bash
# Scan only /about pages
a11yscan example.com --filter "/about"

# Scan only /research pages, excluding the archive
a11yscan example.com \
  --filter "/research" \
  --exclude "/research/archive"

# Scan /news but limit to the first 20 pages
a11yscan example.com --filter "/news" --limit 20
```

### Scan with glob patterns

Use `--filter-glob` for more flexible matching with wildcards. Patterns match against the URL pathname using picomatch syntax:

```bash
# All service pages under any top-level section
a11yscan example.com --filter-glob "/*/services/**"

# Only pages exactly two levels deep
a11yscan example.com --filter-glob "/*/*"

# All "about" pages regardless of nesting
a11yscan example.com --filter-glob "**/about*"
```

### Combine prefix and glob filters

When both `--filter` and `--filter-glob` are used, a URL must match **both** (AND logic):

```bash
a11yscan example.com --filter "/grants" --filter-glob "/grants/*/overview"
```

### Exclude specific sections

Use `--exclude` with comma-separated prefixes to skip sections:

```bash
a11yscan example.com --exclude "/blog,/archive"
```

### Control scan depth

Use `--depth` to limit how deep into the URL path hierarchy to scan:

```bash
# Only top-level pages (e.g., /about, /contact — not /about/team/leadership)
a11yscan example.com --depth 1
```

### Custom report filenames

```bash
a11yscan example.com --filter "/research" --filename "research-audit-q1"
# Produces: reports/example.com/research-audit-q1.json, .csv, .html
```

### Adjust concurrency

```bash
# Slower but gentler on the target server
a11yscan example.com --concurrency 1

# Faster scans (max 5 parallel pages)
a11yscan example.com --concurrency 5
```

### CI/CD mode

```bash
a11yscan example.com --ci --output json
# Outputs JSON summary to stdout
# Exits 0 if no violations, 1 if violations found
```

#### GitHub Actions example

```yaml
- name: Accessibility audit
  run: |
    npx playwright install chromium
    a11yscan ${{ env.SITE_URL }} --ci --output json
```

## CLI Flags

| Flag | Type | Default | Description |
|---|---|---|---|
| `[url]` | string | (none) | Site URL — auto-appends `/sitemap.xml` |
| `--sitemap <url>` | string | (none) | Explicit URL to sitemap.xml |
| `--filter <path>` | string | (all pages) | Path prefix to include (e.g., `/research`) |
| `--filter-glob <pattern>` | string | (none) | Glob pattern for URL pathname matching |
| `--exclude <paths>` | string | (none) | Comma-separated path prefixes to exclude |
| `--depth <n>` | number | unlimited | Max URL path depth to include |
| `--limit <n>` | number | unlimited | Max number of pages to scan |
| `--output <formats>` | string | `csv,json,html` | Comma-separated: csv, json, html |
| `--filename <name>` | string | `aria-report-{timestamp}` | Base filename for reports |
| `--concurrency <n>` | number | `4` | Parallel pages to scan (1-5) |
| `--ci` | boolean | `false` | CI mode: JSON to stdout, exit codes |

## Report Output

Reports are saved to `./reports/{hostname}/` — one subfolder per site. Each scan replaces the previous reports for that site, so you always have the latest results.

**Default output (csv + json + html):**
```
reports/
  r3.illinois.gov/
    aria-report-2026-03-13-0948.csv
    aria-report-2026-03-13-0948.json
    aria-report-2026-03-13-0948.html
  icjia.illinois.gov/
    aria-report-2026-03-13-1015.csv
    aria-report-2026-03-13-1015.json
    aria-report-2026-03-13-1015.html
```

After each scan, you're prompted to open the HTML report in your browser. The HTML report is a self-contained, styled page with sortable patterns, impact badges, HTML snippets, and expandable URL lists.

## Exit Codes

| Code | Meaning |
|---|---|
| 0 | Scan complete, no violations found |
| 1 | Scan complete, violations found |
| 2 | Configuration or fetch error |
| 3 | Scan interrupted (partial results written) |

## Configuration

All configurable values are centralized in `packages/cli/src/a11y.config.ts`. This file is the single source of truth for:

- Tool identity (name, version)
- Default output formats and report directory
- Concurrency limits
- Timeouts (page load, network idle, sitemap fetch)
- axe-core rule IDs to scan
- Blocked hosts (SSRF prevention)
- Root cause hint patterns
- Exit codes
- CSV column headers

The file is organized from easy-to-change values at the top (report prefix, concurrency) to values that require careful testing at the bottom (axe rules, exit codes).

## Deployment

### Marketing site — Netlify

The marketing site (`packages/web`) is a Nuxt 4 static site that deploys to Netlify:

1. Connect the GitHub repo to Netlify
2. Set the build settings:
   - **Base directory:** `packages/web`
   - **Build command:** `pnpm generate`
   - **Publish directory:** `packages/web/.output/public`
   - **Node version:** `20` (set in `.nvmrc` or Netlify environment)
3. Netlify will auto-deploy on every push to `main`

### CLI tool — Digital Ocean / Laravel Forge

The CLI (`packages/cli`) runs as a Node.js process on a server. It needs a headless Chromium browser, so it requires a real server (not serverless).

**Recommended setup with Laravel Forge on a Digital Ocean droplet:**

1. **Droplet spec:** 2 vCPU / 4 GB RAM minimum (Chromium is memory-hungry)
2. **OS:** Ubuntu 22.04 or 24.04
3. **Provision with Forge:** Let Forge set up the droplet with Node.js 20+
4. **Install dependencies:**
   ```bash
   # On the droplet via Forge SSH
   cd /home/forge/a11yscan
   pnpm install --frozen-lockfile
   pnpm --filter a11yscan build
   npx playwright install --with-deps chromium
   ```
5. **Run scans via Forge scheduler or SSH:**
   ```bash
   node /home/forge/a11yscan/packages/cli/dist/index.js \
     --sitemap https://yoursite.com/sitemap.xml \
     --output json \
     --filename "scheduled-audit"
   ```
6. **Optional: Forge cron job** for scheduled audits (e.g., weekly):
   ```
   0 6 * * 1  cd /home/forge/a11yscan && node packages/cli/dist/index.js --sitemap https://yoursite.com/sitemap.xml --output csv,json,html --filename "weekly-audit"
   ```

**Why not serverless?** Playwright requires a persistent Chromium process. Lambda/Cloud Functions have 512 MB memory limits and no persistent browser processes. A $24/mo DO droplet handles this easily.

## Roadmap

### Phase 1 — CLI Scanner (current)

The core scanning engine. Everything needed to audit a site from the command line.

- Sitemap fetching with SSRF protection and retry logic
- URL filtering: prefix, glob (picomatch), exclude, depth, limit
- Bare URL mode with auto-sitemap discovery (`a11yscan r3.illinois.gov`)
- Playwright scanner with AxeBuilder API, concurrency (p-limit, default 4)
- Browser crash recovery with automatic relaunch
- Pattern analysis: violations grouped by rule + normalized CSS selector
- Root cause hints (Vuetify, Nuxt, WordPress, Material UI, etc.)
- CSV, JSON, and HTML reporters
- LLM-ready JSON with `htmlSnippet`, `failureSummary`, `rawSelector`
- Per-site report subfolders with auto-cleanup (latest scan only)
- SIGINT handling with partial report writing
- CI/CD mode with machine-readable JSON output
- `a11y.config.ts` single source of truth for all configurable values
- 54 unit tests across all modules

### Phase 2 — Extended Reporters

Additional output formats and reporting enhancements.

- Markdown reporter (for pasting into GitHub issues / PRs)
- Report diffing: compare two scans to show new/resolved patterns
- Trend tracking across multiple scan runs
- Summary email digest (for scheduled server scans)

### Phase 3 — Interactive Wizard

Guided mode for users who don't want to memorize CLI flags.

- Interactive wizard via inquirer (ESM-compatible)
- Saved scan profiles (re-run common scans with a single command)
- Profile management: create, list, edit, delete
- `a11yscan --profile production` shorthand

### Phase 4 — Puppeteer Fallback

Alternative browser engine for environments where Playwright is unavailable.

- Puppeteer scanner as drop-in alternative to Playwright
- `--engine puppeteer` flag
- Shared ScannerManager interface between engines

### Phase 5 — Marketing Site

Public-facing site at a11yscan.dev for documentation and demos.

- Nuxt 4 + Nuxt UI static site
- Deployed to Netlify via `pnpm generate`
- Interactive demo, documentation, and pattern gallery
- SEO and OpenGraph metadata

## Platform Support

| Platform | Support |
|---|---|
| macOS (latest) | Full |
| Linux (Ubuntu 22.04+) | Full |
| Windows (WSL2 + Ubuntu) | Supported |
| Windows (native) | Not supported |

## License

MIT
