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

After this, you can run `a11yscan` directly from any directory:

```bash
a11yscan --sitemap https://example.com/sitemap.xml --output csv,json
```

## Usage

### Basic scan — full site

```bash
a11yscan --sitemap https://example.com/sitemap.xml --output csv,json
```

### Scan only a specific section (prefix filter)

Use `--filter` to scan only pages whose URL path starts with a given prefix. This is the fastest way to audit a single section of a large site:

```bash
# Scan only /about pages
a11yscan --sitemap https://example.com/sitemap.xml --filter "/about"

# Scan only /research pages, excluding the archive
a11yscan \
  --sitemap https://example.com/sitemap.xml \
  --filter "/research" \
  --exclude "/research/archive"

# Scan /news but limit to the first 20 pages
a11yscan \
  --sitemap https://example.com/sitemap.xml \
  --filter "/news" \
  --limit 20
```

### Scan with glob patterns

Use `--filter-glob` for more flexible matching with wildcards. Patterns match against the URL pathname using picomatch syntax:

```bash
# All service pages under any top-level section
a11yscan \
  --sitemap https://example.com/sitemap.xml \
  --filter-glob "/*/services/**"

# Only pages exactly two levels deep
a11yscan \
  --sitemap https://example.com/sitemap.xml \
  --filter-glob "/*/*"

# All "about" pages regardless of nesting
a11yscan \
  --sitemap https://example.com/sitemap.xml \
  --filter-glob "**/about*"
```

### Combine prefix and glob filters

When both `--filter` and `--filter-glob` are used, a URL must match **both** (AND logic):

```bash
# Pages under /grants that match a wildcard pattern
a11yscan \
  --sitemap https://example.com/sitemap.xml \
  --filter "/grants" \
  --filter-glob "/grants/*/overview"
```

### Exclude specific sections

Use `--exclude` with comma-separated prefixes to skip sections:

```bash
# Scan everything except /blog and /archive
a11yscan \
  --sitemap https://example.com/sitemap.xml \
  --exclude "/blog,/archive"
```

### Control scan depth

Use `--depth` to limit how deep into the URL path hierarchy to scan:

```bash
# Only top-level pages (e.g., /about, /contact — not /about/team/leadership)
a11yscan \
  --sitemap https://example.com/sitemap.xml \
  --depth 1
```

### Custom report filenames

```bash
a11yscan \
  --sitemap https://example.com/sitemap.xml \
  --filter "/research" \
  --filename "research-audit-q1"
# Produces: reports/research-audit-q1.json and reports/research-audit-q1.csv
```

### Adjust concurrency

```bash
# Slower but gentler on the target server
a11yscan --sitemap https://example.com/sitemap.xml --concurrency 1

# Faster scans (max 5 parallel pages)
a11yscan --sitemap https://example.com/sitemap.xml --concurrency 5
```

### CI/CD mode

```bash
a11yscan \
  --sitemap https://example.com/sitemap.xml \
  --ci \
  --output json
# Outputs JSON summary to stdout
# Exits 0 if no violations, 1 if violations found
```

#### GitHub Actions example

```yaml
- name: Accessibility audit
  run: |
    npx playwright install chromium
    a11yscan --sitemap ${{ env.SITE_URL }}/sitemap.xml --ci --output json
```

## CLI Flags

| Flag | Type | Default | Description |
|---|---|---|---|
| `--sitemap <url>` | string | **required** | URL to sitemap.xml |
| `--filter <path>` | string | (all pages) | Path prefix to include (e.g., `/research`) |
| `--filter-glob <pattern>` | string | (none) | Glob pattern for URL pathname matching |
| `--exclude <paths>` | string | (none) | Comma-separated path prefixes to exclude |
| `--depth <n>` | number | unlimited | Max URL path depth to include |
| `--limit <n>` | number | unlimited | Max number of pages to scan |
| `--output <formats>` | string | `csv,json` | Comma-separated: csv, json |
| `--filename <name>` | string | `aria-report-{timestamp}` | Base filename for reports |
| `--concurrency <n>` | number | `3` | Parallel pages to scan (1-5) |
| `--ci` | boolean | `false` | CI mode: JSON to stdout, exit codes |

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
   0 6 * * 1  cd /home/forge/a11yscan && node packages/cli/dist/index.js --sitemap https://yoursite.com/sitemap.xml --output csv,json --filename "weekly-audit"
   ```

**Why not serverless?** Playwright requires a persistent Chromium process. Lambda/Cloud Functions have 512 MB memory limits and no persistent browser processes. A $24/mo DO droplet handles this easily.

## Platform Support

| Platform | Support |
|---|---|
| macOS (latest) | Full |
| Linux (Ubuntu 22.04+) | Full |
| Windows (WSL2 + Ubuntu) | Supported |
| Windows (native) | Not supported |

## License

MIT
