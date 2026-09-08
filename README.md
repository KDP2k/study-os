# Kris // Study OS — Supabase Cloud Edition

A personal academic operating system for Lakehead Software Engineering, built with Next.js, TypeScript, Supabase Auth/PostgreSQL, responsive Fall/Winter UI, structured schedules, Markdown-first notes, cue cards, adaptive review, assignments/grades, resources, active recall, AI-ready exports, and cloud persistence.

## What this build does now

- Next.js App Router + TypeScript.
- Public lander at `/` and authenticated Study OS at `/app`.
- Supabase email/password authentication.
- Supabase PostgreSQL cloud persistence for:
  - notes
  - cue cards
  - assignments / assessments
  - resources
  - mistakes
- Debounced note autosave so typing does not issue a database request on every keystroke.
- Local browser cache is retained as a recovery/offline safety layer.
- Existing local-only prototype data is automatically promoted to Supabase on the first login if the cloud account is empty.
- Manual local-cache import is also available in Settings.
- Cloud refresh and sync status are visible in the UI.
- Server-only backend health endpoint at `/api/backend/health` uses the Supabase secret key without exposing it to the browser.
- Row Level Security from the included migrations keeps each signed-in user's rows private.
- Semester/course records are bootstrapped automatically for each Supabase user.
- All original Study OS features remain: Fall/Winter semester switching, schedules, course workspaces, native notes, slash commands, cue cards, review queue, mistake bank, assignment/grade tools, recall mode, mixed review, library, exports, command palette, responsive mobile UI, and dark mode.

## 1. Install and run

Node.js 20+ is required. Node 22 is recommended.

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

The app workspace is:

```text
http://localhost:3000/app
```

## 2. Environment variables

This ZIP already contains the test `.env.local` supplied for this project. `.env.local` is ignored by Git.

The expected variables are:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_SUPABASE_ANON_KEY=                 # optional legacy alias
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...       # server only
OPENAI_API_KEY=sk-...                         # reserved for AI provider work
```

Never rename the Supabase secret or OpenAI key to a `NEXT_PUBLIC_*` variable.

## 3. Run the Supabase SQL migrations

Before the first login, open:

**Supabase Dashboard → SQL Editor**

If you have not run any Study OS schema yet, execute:

```text
supabase/setup.sql
```

That file contains both migrations in order.

If `0001_initial.sql` was already run previously, execute only:

```text
supabase/migrations/0002_cloud_sync.sql
```

The migrations create the academic tables, RLS owner policies, cloud-sync IDs, and the indexes needed by the app.

## 4. Create the first account

Open `/app` and select **Create account**.

If email confirmation is enabled in your Supabase Auth settings, confirm the email and then sign in. If confirmation is disabled, the new session can start immediately.

Once signed in, Study OS automatically creates your Fall/Winter semester/course rows for that user and loads cloud data.

## 5. Test that cloud persistence works

The quickest complete test is:

1. Sign in.
2. Open a course.
3. Create a lecture note called `Supabase test`.
4. Type a few words and wait until the top bar says **Cloud saved**.
5. In Supabase, open **Table Editor → notes**.
6. Confirm the note row exists.
7. Refresh the browser. The note should still be present.
8. Open the same Vercel deployment on another browser/device, sign into the same account, and verify the same note loads there.

You can also open **Settings → Test backend**. It calls `/api/backend/health` and checks that the server secret can reach the `notes` table.

## 6. Vercel deployment

1. Push the project to GitHub.
2. Import it into Vercel.
3. Add the four environment variables under **Project → Settings → Environment Variables**.
4. Deploy.

Do not commit `.env.local`; Vercel stores its own environment variables securely.

The browser only receives the Supabase project URL + publishable key. `SUPABASE_SERVICE_ROLE_KEY` and `OPENAI_API_KEY` stay server-side.

## Persistence architecture

```text
Browser / phone
      │
      ├── Supabase Auth
      │
      ├── RLS-protected CRUD ───────────► Supabase PostgreSQL
      │                                     ├── notes
      │                                     ├── flashcards
      │                                     ├── assessments
      │                                     ├── resources
      │                                     └── mistakes
      │
      └── localStorage recovery cache
```

Supabase is the cloud source of truth once signed in. The local cache remains useful if the browser is interrupted while typing and for importing old prototype data.

## Important cloud-sync files

```text
lib/supabase/client.ts                  browser-safe Supabase client
lib/supabase/studyRepository.ts         cloud serialization, bootstrap, fetch, sync, deletes
components/StudyProvider.tsx            auth + state + debounced cloud sync
components/AuthGate.tsx                 sign in / sign up UI
components/SettingsPage.tsx             backend test, refresh, local import, backup
app/api/backend/health/route.ts          server-only Supabase health test
supabase/migrations/0001_initial.sql     normalized database + RLS
supabase/migrations/0002_cloud_sync.sql  stable client IDs for browser/cloud sync
supabase/setup.sql                       both migrations combined
```

## Existing Study OS functionality

- Fall 2026 / Winter 2027 semester switcher.
- Structured timetable generated from the supplied schedules.
- Current/next class detection.
- Course workspaces with labs grouped into parent courses.
- Original abstract course artwork.
- Markdown-first lecture notes.
- Slash commands: `/heading`, `/equation`, `/code`, `/callout`, `/definition`, `/question`, `/exam`, `/flashcard`.
- Cue cards with Again / Hard / Good / Easy review.
- Mistake bank.
- Assignment tracker and weighted-grade rollup.
- Resource library.
- Recall Mode and mixed/interleaved review.
- AI-context packet generator.
- Markdown, JSON, cue-card and course ZIP exports.
- Global JSON backup.
- `Cmd/Ctrl + K` search/command palette.
- Mobile bottom navigation and mobile schedule view.
- Dark mode.

## Schedule notes

The app intentionally does not invent schedule information that was not visible in the supplied screenshots. Winter rooms/instructors remain unknown where not shown, and SOCI 2755 has no fixed meeting encoded because a meeting time was not visible.

## Security notes

- `.env.local` is listed in `.gitignore`.
- Publishable Supabase keys are expected in browser code; RLS protects user data.
- The Supabase secret key is only referenced by the server health route.
- Normal study CRUD uses the signed-in user's Supabase session and RLS rather than the service key.
- Before a real production launch, rotate any secrets that have ever been pasted into chat, copied into logs, or shared outside your machine.
