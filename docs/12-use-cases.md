# a11yscan — Use Cases
**Doc 12 of 12**
Version 1.0 | March 2026

---

## Use Case 1: Pre-Deadline Section Audit (Primary Use Case)

**Who:** State agency web developer, April 24, 2026 ADA Title II deadline approaching.

**Situation:** The ICJIA main site has ~1,860 pages. Full audit is overwhelming. Compliance strategy is section-by-section: audit `/research` first, remediate, document, move to `/news`, repeat.

**Command:**
```bash
a11yscan \
  --sitemap https://icjia.illinois.gov/sitemap.xml \
  --filter "/research" \
  --exclude "/research/archive" \
  --output csv,json,html \
  --filename research-audit-2026-03-06
```

**Outcome:** HTML report shared with accessibility coordinator. CSV imported into compliance tracking spreadsheet. JSON saved to repo for audit trail. 12 patterns identified; developer fixes 3 Vuetify component issues that resolve 847 violations.

---

## Use Case 2: First-Time User (Interactive Wizard)

**Who:** Web team member at a county agency. Not a daily CLI user. Has been handed the tool by a colleague.

**Command:**
```bash
a11yscan
```

**Interaction:** Wizard guides them through sitemap URL, filter, and output format. They select all 4 output formats. Wizard shows them the assembled command. They save it as `county-site-full`. They run it and share the HTML report with their supervisor.

**Outcome:** User now understands the flag syntax from the assembled command preview. Next run: `a11yscan --profile county-site-full`. Tool adoption succeeds without documentation friction.

---

## Use Case 3: CI/CD Integration

**Who:** DevOps engineer adding accessibility gates to a state agency's GitHub Actions workflow.

**Workflow step:**
```yaml
- name: Accessibility audit
  run: |
    a11yscan \
      --sitemap ${{ env.SITE_URL }}/sitemap.xml \
      --filter "/" \
      --limit 50 \
      --output json \
      --ci \
      --min-impact serious \
      --threshold 0
  continue-on-error: false
```

**Outcome:** Build fails if any serious or critical accessibility violations are introduced. JSON output captured as artifact. Over time, threshold is lowered as violations are resolved.

---

## Use Case 4: Vuetify Component Root Cause Investigation

**Who:** Developer suspects that most ARIA violations across a 500-page Nuxt/Vuetify site come from a handful of shared components.

**Command:**
```bash
a11yscan \
  --sitemap https://example.gov/sitemap.xml \
  --output json,md \
  --limit 100
```

**Outcome:** Pattern report shows `.v-autocomplete__content` with `role="listbox"` appearing on 89 of 100 scanned pages — root cause hint: "Likely Vuetify component." Developer fixes the `v-autocomplete` wrapper component. Re-runs audit. That pattern is gone from all 89 pages.

---

## Use Case 5: Management Compliance Report

**Who:** Web director needs to show federal compliance progress to agency leadership.

**Command:**
```bash
a11yscan \
  --profile full-site-audit \
  --output html,csv \
  --filename icjia-compliance-q1-2026
```

**Outcome:** HTML report emailed to leadership. Shows: 12 patterns identified, 3 resolved (with re-audit confirming 0 violations for those patterns), 9 remaining. CSV attached to compliance tracking spreadsheet. Non-technical stakeholders can open the HTML report directly in a browser.

---

## Use Case 6: Verifying a Remediation

**Who:** Developer who just fixed a Vuetify `v-tabs` ARIA issue wants to confirm the fix resolves all instances.

**Command:**
```bash
a11yscan \
  --sitemap https://icjia.illinois.gov/sitemap.xml \
  --filter "/research" \
  --output json \
  --filename post-fix-verification \
  --ci
```

**Outcome:** CI mode exits 0 (no violations) or reports remaining count. JSON report compared to pre-fix JSON to confirm the specific pattern is gone. Comparison committed to the compliance audit log.

---

## Use Case 7: WSL2 Developer on Windows

**Who:** State IT staff developer on a Windows 11 machine with WSL2 + Ubuntu installed.

**Setup:**
```bash
# In WSL2 Ubuntu terminal:
npm install -g a11yscan
npx playwright install chromium
a11yscan --sitemap https://example.gov/sitemap.xml --filter "/about"
```

**Outcome:** Tool runs identically to macOS/Linux. Reports written to `~/projects/audit/reports/` inside WSL2 filesystem (accessible from Windows Explorer via `\\wsl$\Ubuntu\...`).

---

## Use Case 8: Focused Color Contrast Audit

**Who:** Designer who needs to specifically address color contrast failures for an upcoming redesign.

**Command:**
```bash
a11yscan \
  --sitemap https://example.gov/sitemap.xml \
  --ignore-rules aria-allowed-role,aria-required-children,aria-required-parent,aria-roles,aria-prohibited-attr,aria-label,button-name,input-button-name,image-alt,label,link-name \
  --output html \
  --filename contrast-only-audit
```

**Outcome:** Report contains only color contrast violations, grouped by selector pattern. Designer can address contrast issues in the design system without noise from other violation types.

---

## Use Case 9: Glob Pattern Filtering for Complex URL Structures

**Who:** Developer on a multilingual government site where pages live under `/en/services/...` and `/es/services/...`.

**Command:**
```bash
a11yscan \
  --sitemap https://example.gov/sitemap.xml \
  --filter-glob "/*/services/**" \
  --output json,html \
  --filename services-audit
```

**Outcome:** Both English and Spanish service pages are scanned. The glob pattern `"/*/services/**"` matches `/en/services/health`, `/es/services/education`, etc. without needing separate `--filter` runs per language prefix.
