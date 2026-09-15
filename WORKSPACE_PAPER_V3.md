# Study OS — Workspace Paper V3

This is a surgical drawing-workspace update. No Supabase schema migration is required.

## What changed

- New drawing pages default to A4 portrait vector coordinates: 1400 × 1980.
- Existing pages retain their saved width/height and are not automatically resized.
- Optional page resize presets: A4 Portrait, Letter Portrait, A4 Landscape.
- Explicit Resize Page action proportionally scales existing vector content to fit.
- Draw/Lock control. Locked mode prevents drawing and restores normal touch scrolling/pinch behavior.
- Mobile workspaces open locked by default.
- Desktop remembers Draw/Lock preference locally in the browser.
- Select tool supports box selection and tap selection.
- Selected handwriting/text can be dragged to move it.
- Selection corner handles proportionally resize handwriting and placed text.
- Delete Selected action.
- Fit Page and Fit Width controls plus manual zoom from 15% to 250%.
- Pen input automatically switches from Fit Page to Fit Width when a stylus enters the canvas.
- Existing true vector eraser, light/dark paper, paper grids, undo/redo, page deletion, and cloud persistence are preserved.

## Storage

No raster image is created. A larger A4 page still stores the same vector strokes/text structure, so page dimensions by themselves do not meaningfully increase storage.

## Database

No database migration is required. Existing `drawing_pages.width`, `height`, and `content` storage already supports the update.

## Deploy

1. Copy this build over the existing local repository. Keep `.git` and `.env.local`.
2. Run `npm install` if needed.
3. Run `npm run build`.
4. Test old pages, a new A4 page, Draw Lock on mobile/touch, Select/Move/Scale, eraser, light/dark paper, and page navigation.
5. Commit and push:

```bash
git add .
git commit -m "Upgrade engineering workspace paper tools"
git push
```

Vercel should redeploy automatically from the existing Git connection.
