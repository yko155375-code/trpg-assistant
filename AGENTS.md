# AGENTS.md

## Project

This repository contains the TRPG table assistant PWA named "蹦滋噶滋蹦小隊".

The app is a static frontend hosted from GitHub/Netlify-style static hosting and uses Supabase as the shared cloud state store. It is designed for mobile-first use during tabletop sessions.

## Current Stable Version

- App version: `v0.1.4 穩定同步版`
- Public state room: `main`
- Supabase table: `public.rooms`
- Main state key in browser storage: `trpg-assistant-state-v24`

When changing user-facing behavior, update the visible version label in `index.html` and bump cache/script query versions so phones do not keep stale files.

## Files

- `index.html`: app shell, visible version label, script loading order.
- `app.js`: main app logic, render functions, dice tools, state changes.
- `sync-fix.js`: cloud sync guard and reliable save/pull behavior.
- `styles.css`: responsive/mobile UI styles.
- `sw.js`: service worker cache list and cache version.
- `manifest.webmanifest`: PWA metadata.
- `assets/`: icon and scene art.

## Development Rules

- Keep the app static: no build step unless explicitly requested.
- Preserve Traditional Chinese UI text.
- Keep the first screen as the usable tool, not a landing page.
- Mobile layout has priority. Avoid UI that requires desktop width.
- Do not remove DM/player mode unless asked.
- Do not expose Supabase service-role or secret keys in frontend files.
- The public publishable Supabase key is allowed in frontend code.
- Avoid destructive resets of player/monster state.
- When changing sync behavior, test two browser tabs/windows conceptually: one tab edits, the other should update after a short delay.

## Versioning

Use this scheme:

- Patch fix: `v0.1.x`
- Small feature: `v0.2`
- Larger stable release: `v1.0`

Every shipped change should update:

- Visible label in `index.html`
- `sync-fix.js?v=...` or `app.js?v=...` query when that file changes
- `cacheName` in `sw.js`

## Verification Checklist

Before considering a change done:

1. Load the public/static page and confirm the version label is visible.
2. Confirm scripts in `index.html` point to the intended versions.
3. Confirm `sw.js` cache name changed after frontend updates.
4. Check that adding/deleting a player does not reappear after a few seconds.
5. Check that typing in an input is not overwritten while the field is focused.
6. If Supabase schema or policies change, verify with a SQL query and review RLS implications.

## Known Constraints

- Netlify may pause the public site if free usage limits are reached.
- If Netlify is paused, GitHub can still hold the latest code, but the public URL will not serve it until hosting is restored or moved.
- The local Windows environment may not have Git installed. Do not claim a local commit was made unless `git` was actually available and the commit succeeded.

## Automation Guidance

For automated Codex work:

- Work from a Git branch or clean worktree.
- Keep diffs small and focused.
- Do not rewrite the whole app unless the task requires it.
- Prefer fixing `sync-fix.js` for sync-only patches.
- Prefer editing `index.html` only for shell/version/script loading changes.
- Include a short summary of changed files and verification results.
