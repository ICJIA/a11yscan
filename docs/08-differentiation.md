# a11yscan — Differentiation
**Doc 08 of 12**
Version 1.0 | March 2026

---

## Competitive Landscape

| Tool | Type | ARIA Focus | Pattern Grouping | SPA Support | Sitemap Filter | Wizard | CLI-First |
|---|---|---|---|---|---|---|---|
| **a11yscan** | CLI | ✅ Primary | ✅ Yes | ✅ Playwright | ✅ Yes | ✅ Yes | ✅ Yes |
| axe-core (raw) | Library | ✅ Yes | ❌ Per-page only | ❌ Manual | ❌ No | ❌ No | ❌ No |
| axe DevTools CLI | CLI | ✅ Yes | ❌ No | ✅ Yes | ❌ Limited | ❌ No | ✅ Yes |
| @axe-core/cli | CLI | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Yes |
| pa11y-ci | CLI | ✅ Yes | ❌ No | ✅ Yes | ⚠️ Manual list | ❌ No | ✅ Yes |
| Deque WorldSpace | SaaS | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| Siteimprove | SaaS | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| WAVE | Browser ext | ✅ Yes | ❌ Per-page | ❌ No | ❌ No | ❌ No | ❌ No |

---

## Primary Differentiators

### 1. Pattern Grouping — The Core Insight
Every other open-source CLI tool gives you a per-page violation list. a11yscan gives you a **pattern frequency table**. For teams using component-based frameworks (Vue, React, Nuxt, Next.js), this is transformative: a single Vuetify `v-autocomplete` component generating bad ARIA roles on 340 pages is **one fix**, not 340 fixes. No open-source tool does this.

### 2. Focused Scope, Not General WCAG
General WCAG auditors produce hundreds of rule categories. a11yscan is deliberately scoped to the three categories most likely to affect SPA/component-framework sites under ADA Title II review: ARIA roles, accessible names, and color contrast. This means faster scans, more actionable reports, and less noise. Power users can unlock full WCAG with `--full-wcag`.

### 3. Sitemap-First with Filtering
Most CLI tools take a URL list. a11yscan takes a **sitemap** and adds filtering on top. For large government sites with 1,000–2,000+ pages, this is the correct mental model: start with the site's own index, then narrow to the section you're working on. Combined with profiles, this makes iterative section-by-section compliance work straightforward.

### 4. Interactive Wizard + Command Preview
The wizard pattern (no args = guided setup) lowers the barrier for team members who aren't daily CLI users. The assembled-command preview before execution serves two purposes: it teaches the direct-mode syntax, and it produces a shareable, reproducible command that can be committed to documentation.

### 5. Self-Hosted, Free, Open Source
Deque WorldSpace and Siteimprove are excellent but cost thousands per year. For state and local government agencies with tight budgets, a free, self-hosted, auditable open-source tool is often the only realistic option. a11yscan is MIT licensed.

### 6. Built for SPAs and Modern Frameworks
`@axe-core/cli` does not render JavaScript. Pa11y-ci supports Puppeteer but requires manual page list configuration. a11yscan defaults to Playwright with full SPA render wait, and is tested specifically against Vue/Nuxt applications — the framework most commonly used in government web modernization projects.

---

## The Marketing Pitch (One Paragraph)

Most accessibility auditors tell you what's wrong. a11yscan tells you what to **fix**. Instead of 1,860 individual violations across 340 pages of your government site, you get 12 patterns — each with a normalized selector, a root cause hint, and every affected URL. Fix the Vuetify component once; resolve 340 pages at once. Built for teams managing large SPA-based sites under real federal deadlines, a11yscan is free, self-hosted, and runs in your terminal in under five minutes.

---

## What a11yscan Is Not

- It is not a replacement for Deque WorldSpace, Siteimprove, or other comprehensive paid platforms
- It is not a WCAG 2.1 AA certification tool — it is a focused developer utility
- It does not auto-fix or patch code
- It does not scan authenticated/login-gated pages (yet)
- It is not a browser extension or GUI tool
- It will not catch every accessibility issue — it targets the highest-impact categories for SPA/framework sites
