# a11yscan — Architecture Decisions
**Doc 11 of 12**
Version 1.0 | March 2026

---

## ADR-001: Playwright as Default Browser Engine

**Decision:** Playwright is the default headless browser. Puppeteer is an optional engine added in Phase 4.

**Rationale:**
- Playwright is more actively maintained and has better TypeScript support
- `@axe-core/playwright` is an official Deque integration — reduces integration surface
- Playwright handles SPA networkidle more reliably than Puppeteer in testing
- Playwright's browser management (bundled Chromium, `playwright install`) is simpler for end users than Puppeteer's historically fragmented Chrome binary management

**Trade-offs:**
- Playwright adds ~100MB to the install footprint via bundled Chromium
- Some users may already have Puppeteer installed and prefer it — hence the Phase 4 option

**Status:** Accepted

---

## ADR-002: TypeScript Strict Mode

**Decision:** TypeScript strict mode, ESNext target, NodeNext module resolution.

**Rationale:**
- The tool handles external data (sitemap XML, axe-core results, user input) — strict types catch bugs at the boundary
- NodeNext module resolution is required for ESM compatibility with chalk v5, inquirer v9, and other modern packages that are ESM-only
- Strict null checks are especially important in the scanner (pages can fail to load, results can be null)

**Trade-offs:**
- More verbose code in some areas (explicit null checks, type assertions)
- NodeNext requires `.js` extensions in imports even for TypeScript files

**Status:** Accepted

---

## ADR-003: Pattern Grouping Key Design

**Decision:** Group violations by `${violationId}::${normalizeSelector(cssSelector)}`.

**Rationale:**
- The violation ID alone is too broad (many different elements can fail `aria-roles`)
- The full selector is too specific (`:nth-child` positions differ across pages)
- The combination of violation type + normalized selector is the right granularity: same component, same problem

**Trade-offs:**
- Normalization is heuristic. Complex selectors may not normalize identically across pages even when they represent the same component. This may under-group some patterns.
- The normalization logic will need refinement based on real-world usage

**Alternative considered:** Group by violation ID + HTML element tag only. Rejected as too broad — would merge unrelated violations on the same element type.

**Status:** Accepted, subject to revision after Phase 1 real-world testing

---

## ADR-004: `conf` for Profile Storage (Not SQLite)

**Decision:** Use `conf` package for profile storage rather than SQLite or flat JSON files.

**Rationale:**
- Profiles are small, simple key-value structures — no relational queries needed
- `conf` handles XDG-compliant storage paths automatically across macOS, Linux, and WSL2
- SQLite would be appropriate if profiles needed versioning, history, or complex queries — they don't
- Flat JSON files in the project directory would pollute the working directory and complicate gitignore

**Trade-offs:**
- `conf` adds a dependency
- Profile data location is OS-dependent (users may not know where to find it)

**Status:** Accepted

---

## ADR-005: HTML Report as Self-Contained File

**Decision:** The HTML report inlines all CSS and JavaScript — no external dependencies.

**Rationale:**
- The primary use case is emailing or sharing the report with non-technical stakeholders (compliance officers, managers)
- External CSS/JS would require a web server or break when the file is moved
- A self-contained file can be opened directly from a file system, attached to an email, or committed to a repo

**Trade-offs:**
- Slightly larger file size
- CSS/JS updates require a tool rebuild (can't hot-patch a deployed report)

**Status:** Accepted

---

## ADR-006: No Windows Native Support

**Decision:** Windows native (Command Prompt, PowerShell) is not supported. WSL2 is required.

**Rationale:**
- Playwright's headless Chromium has known issues on Windows native in certain configurations
- Node.js path handling differences between Windows and POSIX create complexity in the file output layer
- WSL2 provides a genuine Ubuntu environment — the tool behaves identically to Linux
- Supporting Windows native would require significant testing and conditional code paths for minimal benefit

**Trade-offs:**
- Windows users must have WSL2 set up — this is a real barrier for some users
- WSL2 is standard on modern Windows 10/11 and is the recommended development environment for Node.js on Windows anyway

**Mitigation:** Clear documentation in README and marketing site with WSL2 setup link.

**Status:** Accepted

---

## ADR-007: pnpm Monorepo (Not Separate Repos)

**Decision:** CLI and marketing site live in one monorepo.

**Rationale:**
- Version consistency: CLI version and marketing site content stay in sync
- Single CI/CD pipeline
- Shared TypeScript config and tooling
- The marketing site is closely coupled to the CLI — it describes the CLI's current features

**Trade-offs:**
- Slightly more complex Netlify config (base directory must be set)
- `pnpm install` from root installs both packages' dependencies

**Status:** Accepted

---

## ADR-008: Concurrency Default of 3 in Phase 1

**Decision:** Ship `--concurrency 3` (via `p-limit`) as the default from Phase 1, rather than serial scanning.

**Rationale:**
- Serial scanning of 340 pages with 30s timeouts is a worst-case of ~2.8 hours. Even with faster networkidle, 20–30 minutes for a modest scan discourages adoption.
- `p-limit` is a lightweight, well-tested package that adds minimal complexity
- Default of 3 balances speed with memory usage (axe-core is memory-intensive per page)
- Max of 5 is a safety cap — beyond this, axe-core memory usage becomes problematic on typical machines

**Trade-offs:**
- Slightly more complex Phase 1 implementation
- Progress output must handle out-of-order page completion
- Error handling must account for multiple concurrent page failures

**Status:** Accepted

---

## ADR-009: Glob Filtering via picomatch

**Decision:** Add `--filter-glob` using `picomatch` for URL pathname matching, in addition to the existing `--filter` prefix match.

**Rationale:**
- `--filter` (startsWith) covers the common case but fails for sites with URL patterns like `/en/research/...` or date-based paths
- Glob patterns are familiar to CLI users and cover a much wider range of URL structures
- `picomatch` is the glob engine used by Vite, chokidar, and other major tools — well-tested, fast, zero dependencies
- Both `--filter` and `--filter-glob` can be combined (URL must match both)

**Trade-offs:**
- Adds one dependency
- Users must understand glob syntax (but glob is a well-known convention in CLI tools)

**Status:** Accepted
