# Personal Novel Reader — Plan

## Product

A free, installable, mobile-first PWA for one person to read Thai and other text-only novels. It has no account, backend, paid service, analytics, or runtime network dependency. Novel content, chapters, progress, bookmarks, and preferences remain on the device in IndexedDB.

## Features

### Import and editing
- Main import flow accepts pasted text in a large textbox and multiple `.txt` / `.md` files. Markdown files are imported as plain text.
- Detect chapter boundaries from lines such as `บทที่ 1`, `ตอนที่ 1`, `Chapter 1`, and `# heading`; preview detected chapters before saving and allow rename, merge, and split.
- Import new chapters into an existing novel later. Edit title, author, description, and chapter text; delete individual chapters.
- Versioned, validated JSON import is retained only as a backup-restore path. Export a selected novel or library as JSON for manual backup and warn that exports may contain private writing.

### Library
- Bookshelf grid with optional locally stored cover images (resized to at most 900px wide), solid muted title/author fallbacks, a Continue Reading card, title search, and sorting by last read or title.
- Novel details show metadata and chapter list, with edit, add chapters, export, and delete actions.

### Reader
- Smooth animation-frame auto-scroll with play/pause, ten remembered speed levels, touch/wheel pause, and optional automatic next chapter (off by default). Save position during playback and request wake lock.
- Full-screen vertical reading view. Tapping the center toggles top and bottom bars.
- Settings for font family, font size, line height, paragraph spacing, margins, and alignment; Light, Sepia, Dark, and Pure Black (OLED) themes.
- Navigate to previous/next chapter at chapter ends, show progress, chapter X of Y, and estimated time remaining.
- Save exact scroll position and restore it when reopening. Provide a table-of-contents drawer, bookmarks, and Wake Lock API support where available.
- Use `lang="th"`, browser Thai line breaking, and layouts that never scroll horizontally.

### Privacy, offline, and accessibility
- Request persistent browser storage. Export the whole library, covers, progress, bookmarks and preferences into one validated JSON backup; restore with an explicit merge/replace choice and confirmation. Export individual novels as UTF-8 TXT. Remind gently after 14 days without export and confirm every deletion.
- Plain-text chapter rendering only; no HTML rendering. Validate imports before storage and generate internal IDs.
- Keep content private to the browser profile. Provide clear export/backup and local-data deletion guidance.
- Installable PWA with app-shell caching, self-hosted appropriately licensed Thai-friendly fonts, and no external runtime requests.
- Accessible controls, clear Thai rendering, phone-safe areas, and responsive polished commercial-reader styling.

## Screens

1. **Library** — bookshelf, continue-reading card, search, sort, import, storage/help.
2. **Novel details** — metadata, chapter list, edit, add chapters, export, delete.
3. **Reader** — full-screen chapter text, chrome toggle, navigation, progress, TOC, bookmarks, and appearance settings.
4. **Import and preview** — paste/file import, detected chapter preview, rename/merge/split, explicit save; JSON restore as backup-only option.
5. **Settings and data** — appearance preferences, export/backup guidance, and clear-local-data action.

## Data model (IndexedDB via Dexie)

- `novels`: generated local ID, title, optional author/description, created/updated/lastRead timestamps.
- `chapters`: generated local ID, novel ID, order, title, plain text, optional updated timestamp; index by `[novelId+order]`.
- `readingProgress`: novel ID, chapter ID, exact scroll position (and optional character offset), updated timestamp.
- `bookmarks`: generated local ID, novel ID, chapter ID, scroll position or character offset, optional label, created timestamp.
- `preferences`: existing key/value store for typography, spacing, alignment, theme, and reader controls. Cover Blobs use `cover:<novelId>` keys without a database version, store, or index change.

Validate JSON backup schema/version, lengths, and chapter counts before writing; never trust imported IDs. Render user text as React text nodes.

## Folder structure

```text
.
├── public/icons/              # Locally served PWA icons
├── public/fonts/              # Licensed, self-hosted Thai font files
├── src/app/                   # App shell and views
├── src/components/            # Reusable accessible controls
├── src/db/                    # Dexie schema and storage operations
├── src/features/              # Library, reader, import/export, settings
├── src/styles/                # Global styles, themes, local font-face rules
├── src/types/                 # Novel and backup-format types
├── src/main.tsx
├── index.html                 # App metadata and strict CSP
├── vite.config.ts             # PWA and GitHub Pages base path
├── package.json
├── package-lock.json
├── .gitignore
├── AGENTS.md
└── PLAN.md
```

## Phases

1. **Foundation** — initialize Vite + React + TypeScript, GitHub Pages base path and PWA, CSP, local font setup, and Dexie schema.
2. **Local library and reader** — validated import preview and editing, bookshelf/details, chapter navigation, reading-position persistence, reader controls, TOC, bookmarks, and wake lock.
3. **Reading comfort and data controls** — complete typography/themes, export/backup restore, delete, and clear-data flows.
4. **Offline and install readiness** — verify app-shell/font caching, install metadata/icons, offline behavior, and responsive layouts at 375px and 430px widths.
5. **Release** — use only approved dependencies, commit the lockfile, run `npm audit`, resolve high/critical findings, and publish static files to GitHub Pages without novels or secrets.

## Decisions and constraints

- Use only approved packages in `AGENTS.md`; request approval before adding any other package.
- No runtime CDN, remote font, API, or third-party service. GitHub Pages serves static app files only.
- Include font files only after checking license and recording attribution.
- Public hosting exposes app code, while IndexedDB content remains in the phone browser profile.
- Browser storage is not a guaranteed backup; manual JSON export is the backup path.
