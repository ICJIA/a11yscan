# a11yscan — Monorepo & Website Architecture
**Doc 09 of 12**
Version 1.0 | March 2026

---

## Monorepo Overview

The repository is a pnpm workspace monorepo with two packages:

```
a11yscan/                    # repo root
├── packages/
│   ├── cli/                        # The CLI tool (phases 1–4)
│   └── web/                        # Marketing site (phase 5)
├── docs/                           # This design suite
├── pnpm-workspace.yaml
├── package.json                    # Root: scripts, shared devDeps
├── .nvmrc                          # Contains: 20
├── .npmrc                          # pnpm settings
├── .gitignore                      # See spec below
├── netlify.toml                    # Marketing site deploy config
└── README.md                       # Root README (links to packages)
```

### Root Config Files

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

## Root `package.json`

```json
{
  "name": "a11yscan-monorepo",
  "private": true,
  "scripts": {
    "build": "pnpm --filter cli build && pnpm --filter web generate",
    "build:cli": "pnpm --filter cli build",
    "build:web": "pnpm --filter web generate",
    "dev:web": "pnpm --filter web dev",
    "lint": "pnpm --filter cli lint",
    "test": "pnpm --filter cli test"
  },
  "devDependencies": {
    "typescript": "5.x"
  }
}
```

---

## `pnpm-workspace.yaml`

```yaml
packages:
  - 'packages/*'
```

---

## CLI Package (`packages/cli/package.json`)

```json
{
  "name": "a11yscan",
  "version": "1.0.0",
  "description": "Pattern-aware ARIA accessibility auditor CLI",
  "bin": {
    "a11yscan": "./dist/index.js"
  },
  "main": "./dist/index.js",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "start": "node dist/index.js",
    "lint": "eslint src/",
    "test": "vitest"
  },
  "engines": {
    "node": ">=20"
  }
}
```

---

## Web Package (`packages/web/`)

Standard Nuxt 4 app structure. See Phase 5 (Doc 05) for full details.

Pinned versions in `packages/web/package.json`:
```json
{
  "dependencies": {
    "nuxt": "4.4.2",
    "@nuxt/ui": "4.5.1"
  }
}
```

Relevant scripts:
```json
{
  "scripts": {
    "build": "nuxt build",
    "generate": "nuxt generate",
    "dev": "nuxt dev",
    "preview": "nuxt preview"
  }
}
```

> **CSS note:** Nuxt UI 4.x bundles Tailwind CSS v4. Do not install `@nuxtjs/tailwindcss`. The CSS entry point is `app/assets/css/main.css` with `@import "tailwindcss"` and `@import "@nuxt/ui"`. The `nuxt.config.ts` must include `css: ['~/assets/css/main.css']`. See Doc 05 for the complete configuration.

---

## Netlify Deployment

```toml
# netlify.toml (repo root)

[build]
  base    = "packages/web"
  command = "pnpm generate"
  publish = ".output/public"

[build.environment]
  NODE_VERSION = "20"
  PNPM_VERSION = "9"

[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline'"
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
```

---

## CLI Distribution (npm publish)

The CLI package is published to npm as `a11yscan` (or final tool name). 

Pre-publish checklist:
- `pnpm build` compiles TypeScript to `dist/`
- `bin` field in package.json points to compiled entry
- `dist/` is in `.npmignore` exclusion inverse (i.e., dist/ IS included)
- `src/`, `docs/`, `*.ts` source files are excluded from npm package
- `prepublishOnly` script runs `pnpm build`
- Version bump follows semver

Global install:
```bash
pnpm add -g a11yscan
# or
npm install -g a11yscan
```
