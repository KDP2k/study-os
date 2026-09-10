# Study OS V2 — Migration, Test, GitHub & Vercel

This build is additive. Existing notes, cards, assignments, resources, review state, semester/course data, auth, local cache and cloud sync remain in place.

## 1) Back up first (recommended)

In the current Study OS open **Settings → Download backup** before changing the database.

## 2) Upgrade the existing Supabase database

Because your current database already has the V1 schema, run **only**:

`supabase/migrations/0003_study_os_v2.sql`

Open Supabase → SQL Editor → New query, paste the entire file, and click Run.

The migration only adds:

- `flashcards.front_content` and `flashcards.back_content`
- `personal_events`
- `drawing_documents`
- `drawing_pages`
- indexes and owner-only RLS policies

It does not drop or rewrite existing rows.

After the migration, refresh Study OS and wait for **Cloud saved**.

## 3) What to test locally

Run:

```cmd
npm install
npm run dev
```

Open `http://localhost:3000/app` and verify:

1. Sign in with the same existing account.
2. Existing notes and cards are still present.
3. Open an old cue card. Blank lines should now be preserved.
4. Create a new rich cue card using Text / Heading / Code / Equation / Drawing.
5. Draw with the mouse, close the workspace, refresh, and reopen the drawing.
6. Open General, add a personal event, and verify it appears on General and the Dashboard timeline.
7. Add a drawing to a lecture note, refresh, and reopen it.

Then run:

```cmd
npm run build
```

## 4) Verify Supabase

Useful queries:

```sql
select title, category, starts_at from public.personal_events order by starts_at;
select client_id, title, updated_at from public.drawing_documents order by updated_at desc;
select client_id, page_number, jsonb_array_length(content->'elements') as elements from public.drawing_pages order by updated_at desc;
select client_id, front_content, back_content from public.flashcards order by updated_at desc limit 10;
```

## 5) Push to your existing clean GitHub repo

Copy this build over your existing local repo **without replacing `.git` or `.env.local`**.

Then:

```cmd
git status
git add .
git commit -m "Upgrade Study OS to V2 workspace and general calendar"
git push
```

If your branch does not have an upstream:

```cmd
git push -u origin main
```

Do not force push unless you intentionally want to replace Git history.

## 6) Vercel

If your Vercel project is already connected to the GitHub repo, the push should trigger a deployment automatically.

Keep the same environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

No new paid service or environment variable is required.

## Storage design

Handwriting is stored as editable vector stroke JSON in Postgres, not as PNG screenshots. Coordinates are rounded and pointer samples are thinned before saving. That keeps typical engineering scratch pages much smaller than image captures while preserving editability.

Course artwork continues to support your `image_1` through `image_8` files. The component tries `.png` first and falls back to `.jpg` automatically.
