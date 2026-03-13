# a11yscan — Phase 5: Marketing Site
**Doc 05 of 12**
Version 1.0 | March 2026

---

## Phase 5 Goal

Build and deploy the single-page marketing site at `packages/web/`. Dark mode only, modern and sleek, Nuxt 4 + Nuxt UI v4, deployed to Netlify. No dynamic functionality — pure marketing and documentation.

**End of Phase 5 deliverable:** The marketing site is live on Netlify, describes the tool accurately, and links to the GitHub repo.

---

## Design Direction

**Aesthetic:** Dark mode only. Minimal. High contrast. Terminal-inspired typography. Think: a tool made by a developer who respects good design, not a startup trying to raise a Series A.

**Color palette:**
- Background: `#0a0a0a` (near black)
- Surface: `#111111`
- Border: `#222222`
- Primary accent: `#22d3ee` (cyan — accessibility/scan theme)
- Secondary accent: `#a78bfa` (violet)
- Text primary: `#f4f4f5`
- Text muted: `#71717a`
- Critical red: `#ef4444`
- Success green: `#22c55e`

**Typography:**
- Headlines: Inter or system-ui, bold, tight tracking
- Body: Inter, regular weight
- Code/CLI: JetBrains Mono or `font-mono` system stack
- All fonts loaded via `@nuxtjs/google-fonts` or system stack fallback

---

## Page Sections (Single Page, Scroll)

### 1. Hero
- Tool name: `a11yscan`
- Tagline: "Turn 1,860 accessibility violations into 12 patterns."
- Sub-tagline: "A focused CLI auditor for ARIA roles, color contrast, and accessible names — built for teams managing large government and enterprise sites."
- Two CTAs: `pnpm add -g a11yscan` (copy button) and `View on GitHub →`
- Animated terminal window showing the interactive wizard in action (CSS animation, no JS framework needed — or Nuxt transition)

### 2. The Problem
- Brief, honest copy about what axe-core dumps look like at scale
- Visual contrast: "1,860 violations across 340 pages" → "12 patterns. Fix once. Resolve hundreds."
- Simple before/after visual

### 3. Features
Grid of 6 feature cards:
1. **Pattern-Aware Grouping** — violations grouped by root cause, not by page
2. **SPA-Ready** — full JavaScript render via Playwright before scanning
3. **Sitemap Filtering** — audit one section at a time: `/research`, `/about`, `/news`
4. **Interactive Wizard** — no flags memorization required; wizard builds the command for you
5. **Four Output Formats** — CSV, JSON, HTML report, Markdown — for every audience
6. **CI/CD Ready** — structured JSON output, exit codes, threshold flags

### 4. Installation
Tabbed code block (Nuxt UI tabs):
- macOS
- Linux (Ubuntu)
- Windows (WSL2)

```bash
# macOS / Linux
pnpm add -g a11yscan
npx playwright install chromium

# Windows — WSL2 required
# 1. Enable WSL2 and install Ubuntu from Microsoft Store
# 2. Open Ubuntu terminal:
pnpm add -g a11yscan
npx playwright install chromium
```

### 5. Usage Examples
Three terminal window mockups (styled `<pre>` blocks):
1. Direct mode — full flags
2. Interactive wizard — the question/answer flow
3. Profile reuse — `--profile research-section`

### 6. Output Preview
Screenshot or static mockup of the HTML report. Show the pattern grouping, impact badges, and collapsible URL lists. If no real screenshot available at launch, use a designed static mockup.

### 7. Platform Support
Simple table or icon grid:
- ✅ macOS (latest)
- ✅ Linux (Ubuntu 22.04+)
- ✅ Windows via WSL2
- ❌ Windows native (WSL2 required)

WSL2 install link: `https://learn.microsoft.com/en-us/windows/wsl/install`

### 8. Footer
- Tool name + version
- "Built for ADA Title II compliance teams"
- GitHub link
- License (MIT)
- "Not affiliated with Deque Systems or axe-core" (attribution note)

---

## Nuxt 4.4.2 + Nuxt UI 4.5.1 Configuration

> **Tailwind CSS:** Nuxt UI 4.x bundles Tailwind CSS v4 internally. Do **not** install `@nuxtjs/tailwindcss`. CSS is loaded via a single `main.css` entry file using CSS `@import` directives. No `tailwind.config.js` is needed or used.

**`packages/web/package.json`** (pinned versions):
```json
{
  "dependencies": {
    "nuxt": "4.4.2",
    "@nuxt/ui": "4.5.1"
  }
}
```

**`packages/web/nuxt.config.ts`**:
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  future: { compatibilityVersion: 4 },

  modules: ['@nuxt/ui'],

  // Wire in the CSS entry point — required for Tailwind + Nuxt UI styles
  css: ['~/assets/css/main.css'],

  colorMode: {
    preference: 'dark',
    fallback: 'dark',
    // Dark mode only — no toggle exposed to user
  },

  app: {
    head: {
      title: 'a11yscan — Accessibility Auditor CLI',
      meta: [
        { name: 'description', content: 'A focused CLI tool for auditing ARIA roles, accessible names, and color contrast. Built for large government and enterprise sites.' },
        { property: 'og:title', content: 'a11yscan' },
        { property: 'og:description', content: 'Turn 1,860 accessibility violations into 12 patterns.' },
      ]
    }
  }
})
```

**`packages/web/app/assets/css/main.css`** — required CSS entry file:
```css
/* Import Tailwind CSS v4 (bundled with Nuxt UI 4.x) */
@import "tailwindcss";

/* Import Nuxt UI component styles */
@import "@nuxt/ui";

/* Custom theme tokens using Tailwind v4 @theme directive */
@theme {
  /* Project color palette */
  --color-bg: #0a0a0a;
  --color-surface: #111111;
  --color-border: #222222;
  --color-accent: #22d3ee;       /* cyan */
  --color-secondary: #a78bfa;   /* violet */
  --color-text: #f4f4f5;
  --color-muted: #71717a;
  --color-critical: #ef4444;
  --color-success: #22c55e;

  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
}
```

**`packages/web/app/app.config.ts`** — Nuxt UI runtime theme:
```typescript
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'cyan',
      secondary: 'violet',
      neutral: 'zinc',
    }
  }
})
```

---

## Netlify Deployment

Netlify config at repo root (`netlify.toml`):

```toml
[build]
  base    = "packages/web"
  command = "pnpm generate"
  publish = ".output/public"

[build.environment]
  NODE_VERSION = "20"
  PNPM_VERSION = "9"
```

Deploy triggers: push to `main` branch, `packages/web/**` path filter.

Custom domain: configured post-launch when tool name is finalized.

---

## Phase 5 Testing Checklist

- [ ] `pnpm --filter web build` completes without errors
- [ ] Site renders correctly in Chrome, Firefox, Safari
- [ ] Dark mode is enforced — no light mode appears
- [ ] All sections visible and readable on 1440px desktop
- [ ] Responsive layout works on 375px mobile
- [ ] Copy button for install command works
- [ ] GitHub link opens correctly
- [ ] WSL2 install link is correct
- [ ] Terminal animation (if implemented) runs smoothly
- [ ] Page loads with no console errors
- [ ] Lighthouse score: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 90
- [ ] SEO meta tags are present and correct
- [ ] Netlify deploy succeeds from `main` branch push
- [ ] Custom domain configured (post-name-finalization)
- [ ] Site is ironic: the accessibility CLI tool's marketing site passes its own audit
