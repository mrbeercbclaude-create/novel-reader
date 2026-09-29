# Project Rules

## Product and architecture

- Build a personal, mobile-first, installable PWA for reading text-only novels, mainly in Thai.
- Use Vite, React, and TypeScript; Dexie over IndexedDB for persistent data; and `vite-plugin-pwa` for installability and offline app-shell caching.
- Use self-hosted, appropriately licensed Thai-friendly fonts such as Sarabun, Noto Serif Thai, and Noto Sans Thai. Do not load fonts from a CDN.
- This is a single-user app: no login, backend, server-side storage, synchronization, analytics, trackers, or paid services.
- Keep novels, chapters, progress, and preferences on the device. Do not place novels, private data, exports, API keys, or secrets in the public repository.
- GitHub Pages is static hosting only. Keep the PWA base path compatible with the repository URL.
- Prefer accessible controls, clear Thai text rendering, and layouts suitable for phone screens.

## Allowed dependencies

Only use these npm packages: `react`, `react-dom`, `dexie`, `vite`, `vite-plugin-pwa`, `typescript`, `dompurify`, and their official type packages (including `@types/react` and `@types/react-dom`). Prefer no additional package when browser APIs or the approved packages suffice.

Ask the user before adding any other package. In that request, provide the package’s weekly npm downloads and GitHub repository link. Do not install unapproved packages.

## Security and privacy

- Render novel text as plain text only. Never use `dangerouslySetInnerHTML` or `innerHTML` with user content. If Markdown support is added, sanitize rendered HTML with DOMPurify before display.
- Validate imported files and their schema before saving. Treat all imported metadata and chapter contents as untrusted input.
- Add a strict Content-Security-Policy meta tag in `index.html`: scripts must be same-origin only, with no inline scripts; do not permit external scripts or runtime origins. Keep all app assets and fonts local. Avoid inline event handlers and inline executable code.
- Do not make external requests at runtime. Do not add analytics, advertising, trackers, remote fonts, or third-party embeds.
- Do not commit novels, personal data, API keys, tokens, or secrets. Store sample data only when it is clearly fictional and contains no personal information.
- Add ignore rules for JSON exports and backup folders while keeping required project manifests such as `package.json` and `package-lock.json` tracked.
- Treat browser storage as private to that browser profile, not as a guaranteed backup. Explain manual export and local-data deletion plainly in the UI.

## Package and audit rules

- Commit `package-lock.json` and use reproducible `npm ci` installs when a lockfile exists.
- Run `npm audit` after installing dependencies and fix all high and critical vulnerabilities before release. Report issues that cannot be fixed within the approved package set.
- Do not add packages as a convenience without first asking and providing the requested package information.

## Development commands

- `npm install` — install dependencies and update the committed lockfile when intentionally changing dependencies.
- `npm run dev` — run the local development server.
- `npm run build` — produce the static production build.
- `npm run preview` — preview the production build locally.
- `npm audit` — inspect dependency advisories after installation and before release.

Use the repository’s RTK command-prefix guidance when available. Do not claim a command was run unless its result was observed.

## Current state (updated 2026-09-29 — read this first)

Live at https://mrbeercbclaude-create.github.io/novel-reader/ . Every push to `main` deploys through `.github/workflows/deploy.yml` (GitHub Pages). The app is in daily use on an iPad and an Android phone, so a broken push breaks a real reader.

Real layout (the folder tree in PLAN.md is outdated):

- `src/App.tsx`, `src/main.tsx` — shell and routing.
- `src/screens/` — `Library`, `NovelDetails`, `Reader`, `Import`, `Settings`.
- `src/components/` — `CharacterBoards` (board sheet + full-screen viewer), `BackupControls`, `TableOfContents`, `Appearance`, `NovelEditor`, `ChapterEditor`, `Cover`, `Sheet`, `BottomNav`, `Icon`, `AppContext`.
- `src/db.ts` — Dexie schema. Version 2 added the `boards` table. Never edit an existing version; add a new `version(n)` for schema changes.
- `src/lib/` — `splitText` (chapter splitting and chat clean-up), `backup` + `backupFormat` (export, validation, restore), `covers` (image resize), `useAutoScroll`, `useReading`, `preferences`, `dbHelpers`.
- `public/icons/` — app icon of the two cats (Raptor and Mika): 192, 512, maskable 512, apple-touch 180, favicon 64.

Features that already work — do not rebuild them:

- Import from `.txt` or pasted text. Chapters split on lines starting with `บทที่ / ตอนที่ / Chapter N / # `. Pasted ChatGPT chats are cleaned: continuity ledgers (`บันทึกความต่อเนื่อง`), `[ยังไม่จบบท…]` markers and lone `ต่อ` / `เริ่มเขียน` lines are removed.
- Reader with themes, fonts, size, table of contents, bookmarks, saved position, auto-scroll, wake lock.
- Covers per novel. Character boards per novel (upload several images, grid, swipe viewer, zoom, reorder, rename, delete).
- Backup export/import as JSON, including covers and boards. Old backups without boards still import.

Hard-won lessons:

- iOS Safari: Blobs stored in IndexedDB can fail to load after the app is reopened. Store images as `ArrayBuffer` + MIME type (see `boardBlob()` in `src/db.ts`). Do not use `loading="lazy"` on images inside sheets.
- The CSP blocks `fetch()` of `blob:` URLs (`connect-src 'self'`). This is intended; do not loosen the CSP to work around it.
- Reading Blob bytes inside a Dexie transaction lets the transaction auto-commit early. Convert first, then open the transaction (see `restoreLibrary`).
- The service worker auto-updates. Users get a new version after closing and reopening the app.

Working rules:

- `design-ref/` holds copyrighted screenshots used as design reference. It is git-ignored and must never be committed.
- Before finishing any task, run `npm run build` and fix every error. Test at a 375px-wide viewport.
- Keep user data compatible: an existing library and existing backup files must keep working after your change.
- Commit with a clear message. Push only when the user says so.
