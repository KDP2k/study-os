# Vector eraser fix

The Workspace eraser now edits the saved vector geometry instead of painting the paper/background colour over handwriting.

## What changed

- New eraser gestures remove touched portions of pen strokes and split surviving stroke segments cleanly.
- Eraser gestures are committed once at pointer-up, so they do not generate a stream of cloud writes.
- Text can be removed by erasing over its bounding area.
- No new eraser strokes are stored for new work.
- Existing/legacy eraser strokes remain readable. They are replayed against a transparent ink-only layer so they erase ink without punching holes in the paper, dot grid, graph paper, or lined background.
- Undo/redo continues to treat one eraser gesture as one action.

No Supabase migration or environment-variable change is required.
