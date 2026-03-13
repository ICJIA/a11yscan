# a11yscan — Revision & Gap Analysis
**Doc 10 of 12**
Version 1.0 | March 2026

---

## Purpose

This document tracks gaps, open questions, deferred decisions, and post-launch revisions. It is a living document — update it as development reveals new issues or requirements change.

---

## Open Questions (Pre-Phase 1)

| # | Question | Status | Resolution |
|---|---|---|---|
| 1 | Final tool name — `a11yscan` is a placeholder; marketing site name TBD | Open | Decide before Phase 5 (marketing site) |
| 2 | npm scope — publish as `a11yscan` or `@scope/a11yscan`? | Open | Decide before Phase 4 (npm publish) |
| 3 | License — MIT assumed; confirm | Open | Confirm before Phase 1 |

---

## Resolved Gaps (from initial design review)

| # | Issue | Resolution |
|---|---|---|
| 1 | No glob pattern filtering (claimed in goals but not implemented) | Added `--filter-glob` using picomatch in Phase 1 |
| 2 | No test strategy or unit test specs | Added Vitest test framework, test file structure, and required unit tests to Phase 1 |
| 3 | No error recovery / retry strategy | Added error recovery section to Phase 1: sitemap retry, browser crash recovery, partial reports, SIGINT handling |
| 4 | Serial scanning in Phase 1 too slow for real-world use | Moved `--concurrency` (default 3) from Phase 2 to Phase 1 |
| 5 | Root cause hints used naive substring matching | Updated to CSS selector pattern matching to avoid false positives |
| 6 | `--exclude` comma parsing behavior unspecified | Documented: whitespace around commas is trimmed |
| 7 | Doc numbering said "of 13" but there are 13 docs (00–12) | Fixed to "of 12" (docs 00 through 12) |
| 8 | Duplicate repo structure block in LLM build prompt (Doc 07) | Removed duplicate |
| 9 | Exit codes not fully specified | Added exit code table: 0 (clean), 1 (violations), 2 (config error), 3 (interrupted) |
| 10 | pnpm not consistently used as primary package manager in install docs | Updated all install references to use pnpm as primary |
| 11 | Root `build:web` used `pnpm build` instead of `pnpm generate` | Aligned to `pnpm generate` for Netlify static generation |

---

## Known Limitations (Documented, Not Bugs)

| # | Limitation | Phase | Notes |
|---|---|---|---|
| 1 | No authenticated page scanning | All | Login-gated pages skipped; potential future feature |
| 2 | axe-core cannot detect all color contrast issues on CSS gradient backgrounds | All | Known axe-core limitation; document in README |
| 3 | Playwright `networkidle` is not 100% reliable for all SPAs | Phase 1 | `--wait-for-selector` in Phase 4 mitigates; error recovery writes partial reports |
| 4 | Windows native not supported | All | WSL2 required; document clearly |
| 5 | Very large sitemaps (5,000+ URLs) may have high memory usage | Phase 1 | `--limit` flag mitigates; document recommended limits |
| 6 | Selector normalization is heuristic, not perfect | All | Some patterns may be under-grouped; document in README |

---

## Deferred Features (Future Consideration)

| Feature | Reason Deferred | Potential Phase |
|---|---|---|
| Authenticated scanning (cookie/session inject) | Complexity; Phase 1 scope | Post-launch v2 |
| `--wait-for-url-change` flag (SPA router wait) | Edge case; `--wait-for-selector` covers most cases | v2 |
| SARIF output format (for GitHub Code Scanning) | Specialized use case | v2 |
| Incremental scanning (only re-scan changed pages) | Requires state persistence; significant complexity | v2 |
| Slack/email report delivery | Out of scope for CLI tool | v2 or plugin |
| Rule suppression via config file (`.a11yscan.json`) | Nice to have; `--ignore-rules` covers immediate need | v2 |
| `--sitemap-auth` flag for password-protected sitemaps | Edge case | v2 |

---

## Post-Phase Audit Notes

*This section is updated after each phase is built and tested.*

### Phase 1
- [ ] Note any axe-core rule IDs that changed in newer versions
- [ ] Note any sitemapper parsing issues encountered
- [ ] Note any Playwright networkidle reliability issues on specific site types

### Phase 2
- [ ] Validate HTML report in accessibility audit (irony check)
- [ ] Note any Handlebars escaping edge cases found

### Phase 3
- [ ] Note any inquirer version compatibility issues
- [ ] Note any conf storage path issues on WSL2

### Phase 4
- [ ] Document exact Puppeteer version tested and known compatibility notes
- [ ] Note any engine-resolver edge cases

### Phase 5
- [ ] Run `a11yscan` against the marketing site itself — document results
- [ ] Lighthouse scores on first deploy

---

## Revision History

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-03-06 | Initial design suite creation |
