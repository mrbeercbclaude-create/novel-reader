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
