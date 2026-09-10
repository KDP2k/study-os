-- Study OS V2 additive migration.
-- Safe to run after 0001_initial.sql and 0002_cloud_sync.sql.
-- Preserves all existing data and only adds new capabilities.

alter table public.flashcards add column if not exists front_content jsonb;
alter table public.flashcards add column if not exists back_content jsonb;

create table if not exists public.personal_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text not null,
  title text not null,
  description text,
  location text,
  category text not null default 'Personal',
  starts_at timestamptz not null,
  ends_at timestamptz,
  all_day boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, client_id)
);

create table if not exists public.drawing_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text not null,
  course_id uuid references public.courses(id) on delete set null,
  note_client_id text,
  title text not null default 'Workspace',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, client_id)
);

create table if not exists public.drawing_pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id uuid not null references public.drawing_documents(id) on delete cascade,
  client_id text not null,
  page_number integer not null default 1,
  width integer not null default 1400,
  height integer not null default 900,
  background text not null default 'dot' check (background in ('blank','dot','graph','lined')),
  content jsonb not null default '{"elements":[]}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, client_id)
);

create index if not exists personal_events_user_starts_idx on public.personal_events(user_id, starts_at);
create index if not exists drawing_documents_user_updated_idx on public.drawing_documents(user_id, updated_at desc);
create index if not exists drawing_pages_document_page_idx on public.drawing_pages(document_id, page_number);

alter table public.personal_events enable row level security;
alter table public.drawing_documents enable row level security;
alter table public.drawing_pages enable row level security;

drop policy if exists personal_events_owner_policy on public.personal_events;
create policy personal_events_owner_policy on public.personal_events for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists drawing_documents_owner_policy on public.drawing_documents;
create policy drawing_documents_owner_policy on public.drawing_documents for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists drawing_pages_owner_policy on public.drawing_pages;
create policy drawing_pages_owner_policy on public.drawing_pages for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

notify pgrst, 'reload schema';
