# Backend setup checklist

## Supabase

1. Open Supabase → SQL Editor.
2. If the Study OS schema has never been installed, run `supabase/setup.sql`.
3. If `0001_initial.sql` was already run, run only `supabase/migrations/0002_cloud_sync.sql`.
4. Open Authentication → Providers → Email and make sure Email auth is enabled.
5. For the fastest local test, you can either confirm the signup email normally or temporarily disable email confirmation while developing.

## Local app

```bash
npm install
npm run dev
```

Open `http://localhost:3000/app`, create an account, and sign in.

## Verify persistence

1. Create a note.
2. Wait for `Cloud saved` in the header.
3. Supabase → Table Editor → `notes`.
4. The note should appear.
5. Refresh the site — it should reload from Supabase.

## Verify server-only credentials

Study OS → Settings → Test backend.

The route `/api/backend/health` uses `SUPABASE_SERVICE_ROLE_KEY` only on the Next.js server. It never returns the key.

## Vercel

Add these in Vercel → Project → Settings → Environment Variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (optional legacy alias)
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

Then redeploy.

Do not upload `.env.local` to GitHub. It is already ignored by `.gitignore`.
