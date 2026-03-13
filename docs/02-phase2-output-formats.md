# a11yscan — Phase 2: Output Formats & UX Polish
**Doc 02 of 12**
Version 1.0 | March 2026

---

## Phase 2 Goal

Add HTML and Markdown report formats, and upgrade terminal UX with ora spinner and cli-progress bar. Concurrency (`--concurrency`) was implemented in Phase 1. End of Phase 2: the tool produces professional, shareable reports suitable for management review and federal compliance documentation.

**End of Phase 2 deliverable:** `--output csv,json,html,md` all work. HTML report is self-contained, shareable, and print-friendly. Terminal shows a real-time progress bar during scanning.

---

## Scope

### In Phase 2
- HTML report (self-contained, dark/light toggle, collapsible patterns, print stylesheet)
- Markdown report (GitHub/Notion compatible)
- ora spinner for sitemap fetch and initial setup steps
- cli-progress bar for page scanning (replaces inline URL logging)
- `--quiet` flag: suppress all output except errors and final summary
- Report filename timestamping refinement (`YYYY-MM-DD-HHmm` format)

> **Note:** `--concurrency <n>` was moved to Phase 1 (default: 3, max: 5).

### Deferred
- Interactive wizard (Phase 3)
- Puppeteer engine (Phase 4)
- Profile save/load (Phase 3)
- Marketing site (Phase 5)

---

## HTML Report Specification

The HTML report is a **single self-contained file** — no external CSS or JS dependencies. All styles and scripts are inlined. It must be emailable and openable without a web server.

### Structure

```
┌─────────────────────────────────────────────────┐
│  Header: tool name, run date, site audited       │
│  Summary bar: pages scanned / patterns / impact  │
│  [Toggle: Dark / Light]           [Print button] │
├─────────────────────────────────────────────────┤
│  Filter summary: sitemap, filter, exclude, limit │
├─────────────────────────────────────────────────┤
│  Impact breakdown: critical / serious / moderate │
│  (colored badge counts)                          │
├─────────────────────────────────────────────────┤
│  Patterns (sorted by affected page count desc)   │
│                                                  │
│  ▼ P001 [CRITICAL] aria-roles                   │
│     Selector: .v-autocomplete__content           │
│     Affected: 340 pages                          │
│     Root cause: Likely Vuetify component         │
│     Fix: [link to axe docs]                      │
│     ▼ Affected URLs (click to expand)            │
│       • https://icjia.illinois.gov/...           │
│       • https://icjia.illinois.gov/...           │
│                                                  │
│  ▶ P002 [SERIOUS] color-contrast  (collapsed)   │
├─────────────────────────────────────────────────┤
│  Skipped URLs (if any)                           │
└─────────────────────────────────────────────────┘
```

### Design Requirements
- **Dark mode default**, light mode toggle (user preference saved in localStorage)
- Font: system-ui stack (no external font loading)
- Impact badge colors:
  - critical: `#ef4444` (red)
  - serious: `#f97316` (orange)
  - moderate: `#eab308` (yellow)
  - minor: `#6b7280` (gray)
- Collapsible pattern sections (pure CSS `<details>`/`<summary>` — no JS required for collapse)
- Dark mode toggle uses a single JS snippet (minimal)
- Print stylesheet: expand all patterns, remove toggle button, black/white safe
- Responsive: readable on mobile (for review on phones)

### Handlebars Template
Use a Handlebars template compiled at build time and bundled into the CLI. Template file at `src/reporter/templates/report.hbs`. The reporter inlines styles and renders the template server-side — no client-side templating.

---

## Markdown Report Specification

GitHub and Notion compatible Markdown. Uses standard syntax only (no HTML tags).

```markdown
# ARIA Role Audit Report
**Site:** https://icjia.illinois.gov
**Filter:** /research
**Date:** 2026-03-06 14:32
**Tool:** a11yscan v1.0.0

---

## Summary
| Metric | Value |
|---|---|
| Pages scanned | 338 |
| Pages skipped | 2 |
| Total violations | 1,240 |
| Patterns found | 12 |
| Critical patterns | 3 |
| Serious patterns | 5 |

---

## Violation Patterns

### P001 — `aria-roles` [CRITICAL] — 340 pages
**Selector:** `.v-autocomplete__content`
**Description:** Ensures role attribute has an appropriate value for the element
**Root cause hint:** Likely Vuetify component
**Suggested fix:** https://dequeuniversity.com/rules/axe/4.x/aria-roles

<details>
<summary>340 affected URLs</summary>

- https://icjia.illinois.gov/research/reports/...
...
</details>

---
```

---

## Terminal UX — Phase 2

Replace Phase 1's inline URL logging with:

```
a11yscan v1.0.0

⠸ Fetching sitemap...          (ora spinner)
✔ Sitemap fetched — 1,860 URLs found
✔ Filters applied — 340 URLs matched /research

Scanning pages...
████████████░░░░░░░░░░ 156/340 (45%) — ETA 2m 14s

✔ Scan complete

Pages scanned:  338
Pages skipped:  2
Violations:     1,240
Patterns:       12

Reports saved to ./reports/
  ✔ aria-report-2026-03-06-1432.csv
  ✔ aria-report-2026-03-06-1432.json
  ✔ aria-report-2026-03-06-1432.html
  ✔ aria-report-2026-03-06-1432.md
```

---

## Phase 2 Testing Checklist

- [ ] HTML report generates as a single self-contained file (no external requests)
- [ ] HTML report opens correctly in Chrome, Firefox, Safari
- [ ] Dark/light toggle works and persists on reload
- [ ] All patterns are collapsible
- [ ] Affected URL list expands correctly per pattern
- [ ] Impact badges display correct colors
- [ ] Print view expands all sections and renders cleanly
- [ ] HTML report is valid HTML5 (run through W3C validator)
- [ ] Markdown report renders correctly on GitHub
- [ ] Markdown report renders correctly in Notion (paste test)
- [ ] ora spinner appears during sitemap fetch
- [ ] cli-progress bar updates correctly during scan
- [ ] Progress bar shows accurate ETA
- [ ] `--quiet` suppresses all output except final summary and errors
- [ ] All 4 output formats generate correctly in a single run: `--output csv,json,html,md`
- [ ] Timestamp format in filenames is `YYYY-MM-DD-HHmm`
