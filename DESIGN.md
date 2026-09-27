# Reader design

## Reference and ownership

All 15 images in `design-ref/` were opened and inspected before designing.
They are ReadAWrite reference material, are ignored by Git, and must not be
copied into app assets or build output. Use their navigation, hierarchy,
spacing, reading controls, and list patterns. Use our own name, icons, colors,
and user-supplied covers; no reference logos, illustrations, or cover artwork.

## Visual system

- White main surfaces, near-black `#191d1d` text, gray secondary text.
- One accent: soft teal `#20877f`; white text on filled accent buttons.
- UI font: locally served Noto Sans Thai, 16px minimum body size, 17px list rows.
- Page titles: 32px, left aligned, weight 600. Tabs sit immediately below,
  with a 3px teal underline and teal active label.
- Reader defaults: Noto Sans Thai, 19px, line height 1.9. Also offer Sarabun,
  Noto Serif Thai, and the existing system-font preference for compatibility.
- Thin original SVG outline icons share a 24px viewbox and 1.65px stroke.
  Active navigation icons are filled and teal. No emoji icons.
- Buttons and interactive rows have at least 44px touch targets.
- Use 16–20px page gutters, quiet 1px separators, and 10–16px corners on lists
  and sheets. No decorative shadows or oversized rounded card framing.
- Only opacity/translate transitions on sheets and reader bars, at 160ms;
  respect reduced motion. No other animation.
- iPhone safe-area insets pad top bars, bottom bars, and sheets.

## Screens

### Library / ชั้นหนังสือ

Large title, add button, underlined All / With bookmarks tabs. Search and
last-read/title sort below. Keep a compact continue-reading row showing novel,
chapter, and saved chapter percentage. Two columns at phone widths show covers
and readable title/author text. Empty states use plain text and one action.
Persistent bottom navigation: ชั้นหนังสือ / กำลังอ่าน / ตั้งค่า.

### Reading list / กำลังอ่าน

Use the same title and tab pattern. Recent books retain their last position;
the bookmarks tab lists saved locations with separate accessible delete buttons.
Opening a location resumes the same novel, chapter, and scroll position.

### Novel details

Full-width cover at the top. An uploaded image alone may have a dark gradient
fade into the dark metadata section. Show title, author, description, chapter
count, filled teal อ่านเลย, and outline เพิ่มบท. Editing and cover upload are
available through labeled controls. Chapter list returns to white surfaces.

### Reader

Full viewport vertical text. Thin top bar: back, truncated chapter title, TOC,
Aa, bookmark, and more. Story name is small above the centered chapter heading.
Bottom bar shows chapter count, progress, estimated time, and ก่อนหน้า / ถัดไป.
Tap the central text region to hide/show both bars; hidden bars do not receive
focus. Keep chapter-end previous/next buttons. TOC and bookmarks use a sheet
with an active row, clear chapter numbering, and independent delete controls.

### Reading settings sheet

Bottom sheet: font dropdown; Aa− / Aa+ / reset controls; four theme swatches
(white, beige, gray, black) with teal selected outline; three line-height
buttons. Retain paragraph spacing, margins, alignment, font-size range, and
fine line-height controls so no prior setting is removed.

### Import

Plain white sheet with large paste textbox, multiple TXT/MD file selection,
editable chapter previews, rename, merge, split, delete-preview, and explicit
save. Split at the textarea caret when selected, with a paragraph-boundary
fallback. Add-to-existing-novel keeps the same flow.

### Settings

Large title on a light-gray page. Grouped white rounded lists with left labels,
right values/chevrons, and functional right-hand switches for cover display
and keeping the screen awake. Reading appearance opens the same settings
sheet used in Reader. Explain device-local storage and backup behavior plainly.

## Cover storage and compatibility

User uploads PNG, JPEG, or WebP. Decode and resize to at most 900px wide,
re-encode to a Blob, and store under `cover:<novelId>` in the existing
`preferences` key/value table. Never export the image into public assets.
This uses no new database version, store, index, or migration. Existing text
preferences, novels, chapters, progress, and bookmarks retain their format.
No-image fallback is a stable solid muted color, large Thai title, small author.

## Exclusions and checks

No gradients except the dark fade over an uploaded detail cover; no
glassmorphism, blur, glow, neon, purple, emoji icons, mixed icon styles,
Inter, Roboto, Arial, Space Grotesk, bouncy animation, or marketing greetings.
Verify Library, Reading list, Novel details, Reader, Import, Settings, and
the TOC/appearance sheets at 375px and 430px. Check no horizontal overflow,
font loading, readable controls, and persistence. Run the production build.
