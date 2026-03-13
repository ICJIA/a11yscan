# a11yscan — Phase 3: Interactive Wizard & Profiles
**Doc 03 of 12**
Version 1.0 | March 2026

---

## Phase 3 Goal

Add the interactive wizard (invoked with no arguments) and named profile save/load. End of Phase 3: a developer unfamiliar with the CLI flags can run `a11yscan` with no arguments, answer questions, see the assembled command, and save it as a reusable profile.

**End of Phase 3 deliverable:** `a11yscan` (no args) launches the wizard. `a11yscan --profile research-section` replays a saved config.

---

## Scope

### In Phase 3
- inquirer-based interactive wizard
- Assembled-command preview before execution
- Profile save prompt at end of wizard
- `--profile <name>` flag to load a saved profile
- `--profile <name> --list-profiles` to show all saved profiles
- `--save-profile <name>` flag to save current flags as a profile without running
- Profile storage via `conf` package (XDG-compliant, OS-appropriate location)
- `--delete-profile <name>` flag

### Deferred
- Puppeteer engine (Phase 4)
- `--full-wcag` flag (Phase 4)
- Marketing site (Phase 5)

---

## Wizard Flow

Full question sequence with defaults shown in brackets:

```
a11yscan v1.0.0 — Interactive Setup
──────────────────────────────────────────

? Sitemap URL:
  › https://icjia.illinois.gov/sitemap.xml

? Filter to path prefix (leave blank for all pages):
  › /research

? Exclude paths (comma-separated, leave blank for none):
  › /research/archive, /research/old

? Max path depth (leave blank for unlimited):
  › 3

? Max pages to scan (leave blank for unlimited):
  › 100

? Headless browser engine:
  ❯ Playwright (recommended)
    Puppeteer

? Output formats (space to select, enter to confirm):
  ◉ CSV
  ◉ JSON
  ◉ HTML
  ◉ Markdown

? Report filename base (leave blank for auto-timestamp):
  › research-audit

? Concurrency (parallel pages, 1–5): [3]
  › 3

──────────────────────────────────────────
Ready to run:

  a11yscan \
    --sitemap https://icjia.illinois.gov/sitemap.xml \
    --filter "/research" \
    --exclude "/research/archive,/research/old" \
    --depth 3 \
    --limit 100 \
    --engine playwright \
    --output csv,json,html,md \
    --filename research-audit \
    --concurrency 3

? Save this as a profile? (y/N) › y
? Profile name: › research-section

✔ Profile saved as "research-section"

Running audit...
```

### Wizard UX Rules
- Every question has a sensible default shown inline
- Pressing Enter on any question accepts the default
- Blank answers for optional fields (filter, exclude, depth, limit, filename) use the default behavior
- The assembled command is shown **before** execution — user can Ctrl+C to abort
- The assembled command uses `\` line continuation for readability
- Profile name is validated: lowercase, hyphens only, max 40 chars

---

## Profile Storage

Uses `conf` package. Profiles stored at OS-appropriate location:
- macOS: `~/Library/Preferences/a11yscan/`
- Linux/WSL2: `~/.config/a11yscan/`

Profile file format (JSON):
```json
{
  "research-section": {
    "sitemap": "https://icjia.illinois.gov/sitemap.xml",
    "filter": "/research",
    "exclude": ["/research/archive", "/research/old"],
    "depth": 3,
    "limit": 100,
    "engine": "playwright",
    "output": ["csv", "json", "html", "md"],
    "filename": "research-audit",
    "concurrency": 3,
    "savedAt": "2026-03-06T14:32:00Z"
  }
}
```

---

## Profile Commands

```bash
# Run a saved profile
a11yscan --profile research-section

# Override one flag when running a profile
a11yscan --profile research-section --limit 50

# Save current flags as a profile without running
a11yscan --sitemap https://... --filter /news --save-profile news-section

# List all saved profiles
a11yscan --list-profiles

# Delete a profile
a11yscan --delete-profile research-section
```

`--list-profiles` output:
```
Saved profiles:
  research-section   (saved 2026-03-06, sitemap: icjia.illinois.gov, filter: /research)
  news-section       (saved 2026-03-05, sitemap: icjia.illinois.gov, filter: /news)
```

---

## Phase 3 Testing Checklist

- [ ] `a11yscan` with no arguments launches the wizard
- [ ] Every wizard question accepts Enter for default value
- [ ] Assembled command preview is displayed before execution
- [ ] Ctrl+C at the preview aborts without running
- [ ] Profile save prompt appears after assembled command
- [ ] Saved profile persists across terminal sessions
- [ ] `--profile research-section` loads and runs the saved config
- [ ] `--profile <name> --limit 50` correctly overrides the saved limit
- [ ] `--list-profiles` shows all saved profiles with metadata
- [ ] `--save-profile <name>` saves without running
- [ ] `--delete-profile <name>` removes the profile
- [ ] Profile names with invalid characters are rejected with a helpful message
- [ ] Profiles stored at correct OS-appropriate path (verify on macOS and Linux)
- [ ] Wizard works correctly inside WSL2
