# Redesign verification — 2026-09-27

## Build gates

- Step 1: extracted screens, state, parser, helpers, and styles; production
  build passed before DESIGN.md and visual changes.
- Final: TypeScript and Vite production build passed.
- No npm packages were added for the redesign.

## Data compatibility and private assets

- AST comparison confirmed database name `aan-plearn`, version 1, all five
  stores, and their indexes are unchanged.
- Cover Blobs use `cover:<novelId>` records in the existing preferences store.
  Original string preferences retain their keys and values.
- `design-ref/` was ignored before implementation. All 15 images were viewed.
  No reference images or QA fixtures appear in the production output.
- This folder currently has no Git repository, so no commits were created.

## Browser checks

Checked at actual CSS viewport sizes 375 × 812 and 430 × 932 in the browser.

| Screen | 375px | 430px | Banned styling |
| --- | --- | --- | --- |
| Library | Pass | Pass | None |
| Reading list | Pass | Pass | None |
| Novel details | Pass | Pass | Only the explicitly allowed image-to-dark fade |
| Reader | Pass | Pass | None |
| Import | Pass | Pass | None |
| Settings | Pass | Pass | None |
| Appearance sheet | Pass | Pass | None |
| Contents / bookmarks sheet | Pass | Pass | None |

No horizontal overflow was measured on these screens. Reader controls were
measured at a minimum of 44px in both dimensions. The settings switches have
full-row label touch targets.

## Interaction evidence

- Pasted Thai and English test text detected three chapter headings.
- Multiple TXT/MD files detected two further chapters.
- Preview rename, split, and merge worked; append increased the novel from
  three to five chapters without replacing the originals.
- Metadata edits persisted.
- A generated 1200 × 1600 test PNG resized to a 900 × 1200 Blob; the image
  remained available after page reload.
- Reopening the reader restored exactly 1624px scroll position.
- Bookmark creation, the bookmarks list, TOC navigation, and next-chapter
  navigation worked.
- Tapping the text center hid both bars and removed their controls from focus;
  tapping again restored them.
- Noto Sans Thai, Sarabun, and Noto Serif Thai loaded locally.
- Font, font size, line spacing, and theme changes worked; pure black rendered
  as rgb(0, 0, 0). Preferences survived a page reload.
- No browser runtime errors were observed in the tested flow.

The test story and generated cover are fictional QA data in the test browser;
they are not bundled with the app. Phone viewport emulation does not replace
physical-device testing of installation, battery behavior, or iPhone safe areas.

## Local phone preview

The production preview was started with:

```powershell
npm run preview -- --port 5173 --strictPort
```

Same-Wi-Fi URL for this session: http://192.168.1.105:5173/
The computer and preview process must remain running. Offline installation and
Wake Lock depend on a secure context; the LAN HTTP preview is for browser use.
