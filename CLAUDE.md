# Project: Velvet Vibrance

## Overview

Velvet Vibrance is one project with several surfaces, all owned by Glenn:

- **Website** — this repo. Public-facing marketing site with events, gallery, and the join-the-frequency email form.
- **Subscriber capture** — Google Apps Script backend in this repo (`WEBAPP.gs`) writing to a Google Sheet.
- **Admin console** — `/admin.html` in this repo. Where Glenn publishes gallery updates and event postings.
- **Operations ledger** — Excel spreadsheet on Glenn's machine (not in this repo but part of the same project). Tracks:
  - Material costs (gear, merch stock, event supplies)
  - Business strategy (positioning, brand direction, partnerships)
  - Growth metrics and targets (subscriber count, event turnout, revenue)
  - Week-by-week plan (what ships, what's booked, what's scheduled)

Treat all of these as one thing. The repo is the code half; the Sheet + spreadsheet are the data half.

## Mission

**Play Madrid in 2027.** Book as many DJ house-music gigs between now and then as possible. Every decision — content, events, spending, partnerships — should be evaluated against whether it moves Velvet Vibrance closer to Madrid gigs and a sustainable house-DJ pipeline.

## Tech Stack (this repo)

- Framework: static HTML/CSS/JS deployed via GitHub Pages (no build step, no bundler)
- Language: HTML, CSS, vanilla JavaScript (ES2020+)
- Key libraries: three.js r134 (entry preloader, admin transitions — pinned via SRI on cdnjs), Lenis 1.0.42 (smooth scroll — pinned via SRI on unpkg), Playfair Display + EB Garamond + Inter (Google Fonts via HTML `<link>`)
- Backend: Google Apps Script (WEBAPP.gs) writing to a Google Sheet, with the secret stored in Script Properties (never in source)
- Financial ledger: Excel spreadsheet — outside this repo, do not attempt to edit or reference from code changes here

## Conventions

- No package manager. No build step. Edit files, refresh browser.
- Preview locally with `python3 -m http.server 8765` from the project root before pushing anything that changes visuals or behavior.
- Every push to `main` auto-deploys to GitHub Pages within 30–90s.
- Never commit the Apps Script secret (`VV_ADMIN_SECRET` in admin.html). Paste it locally only; revert to the `PASTE_YOUR_...` placeholder before `git add admin.html`.
- Every content-touching commit should still work if hooks fail — do not use `--no-verify`.
- Prefer editing existing files. Do not create scaffolding files, README-style docs, or planning notes unless Glenn explicitly asks.

## Notes

- Glenn is the sole person who makes backend changes (Apps Script, Google Sheet, GitHub repo settings) unless another Claude Code agent is explicitly connected to a task. All other content edits should happen through the admin page at `/admin.html` (password-gated soft gate, then GitHub PAT-gated writes).
- The admin login is a *soft gate* — it is not real security. The real credential is the GitHub PAT Glenn pastes in. Do not treat the password as authentication.
- The site is live at https://glenngallacher1-lab.github.io/velvet-vibrance/ (custom domain velvet-vibrance.com is planned).
