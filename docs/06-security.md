# a11yscan — Security
**Doc 06 of 12**
Version 1.0 | March 2026

---

## Overview

a11yscan is a local CLI tool that runs on the user's machine. It does not have a server, a database, or user accounts. The primary security concerns are: safe handling of URLs and sitemaps from untrusted sources, responsible use of a headless browser, and protecting users from SSRF-style attacks where a malicious sitemap could direct the tool to scan internal or harmful URLs.

---

## Threat Model

| Threat | Vector | Mitigation |
|---|---|---|
| Malicious sitemap redirects tool to internal/localhost URLs | `--sitemap` points to attacker-controlled XML | URL allowlist / blocklist validation |
| Sitemap XML with injected script content | Malformed XML in sitemap | Use sitemapper's built-in parsing; never eval sitemap content |
| axe-core results containing script injection | Malicious page returns crafted axe output | Treat all axe results as data; never eval result strings |
| Playwright/Puppeteer browsing malicious pages | Scanning a compromised or honeypot site | Headless browser runs in sandbox; no credentials passed |
| Report HTML containing injected content | Violation descriptions from malicious pages inserted into HTML report | Escape all user-derived content in Handlebars templates |
| Path traversal via `--filename` flag | `--filename ../../etc/passwd` | Sanitize filename: strip path separators, allow `[a-zA-Z0-9._-]` only |
| Profile name injection | `--save-profile ../../malicious` | Sanitize profile names: lowercase, hyphens, alphanumeric only |

---

## URL Validation

Before scanning any URL (from sitemap or otherwise):

```typescript
const BLOCKED_HOSTS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '169.254.',   // link-local
  '10.',        // RFC1918
  '172.16.',    // RFC1918
  '192.168.',   // RFC1918
];

function isSafeUrl(url: string): boolean {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
  const hostname = parsed.hostname.toLowerCase();
  return !BLOCKED_HOSTS.some(blocked => hostname.startsWith(blocked) || hostname === blocked);
}
```

Log and skip any URL that fails validation. In `--ci` mode, include skipped-unsafe URLs in the JSON output meta.

---

## Headless Browser Security

- Playwright/Puppeteer run in headless mode with sandbox enabled (default behavior — do not disable sandbox)
- Do not pass `--no-sandbox` flag (commonly seen in CI workarounds — document the correct alternative: use `--disable-setuid-sandbox` on Linux instead if needed, and document why)
- Never pass user credentials, cookies, or localStorage to the browser
- Browser processes are fully terminated after each scan run
- No persistent browser profiles used

---

## Report Security

### HTML Report
- All content derived from external sources (violation descriptions, selectors, URLs) is escaped via Handlebars' default HTML escaping
- No inline `<script>` tags generated from scan results
- CSP meta tag in generated HTML: `<meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline'; script-src 'unsafe-inline'">` (allows only the minimal inline JS for dark mode toggle)
- `<a>` tags for axe help URLs use `target="_blank" rel="noopener noreferrer"`

### JSON Report
- Standard JSON serialization via `JSON.stringify` — safe by default
- No eval of report content anywhere in codebase

---

## Filename & Path Sanitization

```typescript
function sanitizeFilename(input: string): string {
  // Remove path separators and dangerous characters
  return input
    .replace(/[/\\:*?"<>|]/g, '')
    .replace(/\.\./g, '')
    .substring(0, 100);
}
```

Reports are always written to `./reports/` relative to working directory. Absolute paths in `--filename` are rejected with an error message.

---

## Dependency Security

- Pin all dependencies to exact versions in `package.json` (no `^` or `~`)
- Run `pnpm audit` before each release
- Playwright and Puppeteer are the highest-risk dependencies (large, complex, network-capable)
- Do not include unnecessary dependencies
- Lock file (`pnpm-lock.yaml`) committed to repo

---

## Marketing Site Security

- Static/SSR Nuxt site — no backend, no database, no user input
- No contact forms, no analytics by default
- CSP headers via `netlify.toml`:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline'"
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

---

## Security Checklist (Pre-Release)

- [ ] URL blocklist tested against localhost, 127.0.0.1, 192.168.x.x
- [ ] Filename sanitization tested with path traversal attempts
- [ ] Profile name sanitization tested with special characters
- [ ] HTML report reviewed for XSS: paste a `<script>alert(1)</script>` as a violation description in tests
- [ ] `pnpm audit` shows no high/critical vulnerabilities
- [ ] Playwright running with sandbox enabled (verify via `--verbose` browser launch log)
- [ ] All report `<a>` tags use `rel="noopener noreferrer"`
- [ ] No credentials, API keys, or tokens anywhere in codebase or generated reports
- [ ] `.gitignore` excludes `./reports/` and `./profiles/`
