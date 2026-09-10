# Workspace paper + delete update

This quick update is additive and does not require a Supabase schema migration.

## Changes

- Drawing pages now default to white/light paper.
- Workspace toolbar includes `LIGHT PAPER` / `DARK PAPER` and the setting persists in the existing `drawing_pages.content` JSONB field.
- Dot-grid, graph, lined and blank patterns work on both paper colors.
- Existing near-white/near-black ink adapts visually when paper color is switched so old work stays legible.
- Individual pages can be deleted.
- Deleting the last page asks for confirmation and, if confirmed, deletes the whole workspace set.
- Entire workspace sets can be deleted from the note workspace thumbnails or from inside the full workspace; both paths ask for confirmation.

No existing database rows or tables are removed or replaced.
