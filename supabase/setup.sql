-- Lakehead Study OS — normalized production schema
-- Designed for Supabase/PostgreSQL. The prototype UI currently runs local-first,
-- but every major object already has a destination here.

create extension if not exists pgcrypto;

create type public.study_season as enum ('fall', 'winter', 'spring', 'summer');
create type public.session_type as enum ('lecture', 'lab', 'online');
create type public.flashcard_type as enum ('standard', 'cloze', 'code', 'conceptual', 'derivation', 'error');
create type public.assessment_status as enum ('not-started', 'in-progress', 'submitted', 'graded');

create table public.semesters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null,
  title text not null,
  season public.study_season not null,
  starts_on date,
  ends_on date,
  created_at timestamptz not null default now(),
  unique(user_id, slug)
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  semester_id uuid not null references public.semesters(id) on delete cascade,
  code text not null,
  title text not null,
  short_name text,
  section text,
  lab_section text,
  instructor text,
  art_key text,
  registration_url text,
  created_at timestamptz not null default now(),
  unique(user_id, semester_id, code)
);

create table public.course_sections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  section_code text not null,
  section_type public.session_type not null,
  instructor text,
  room text,
  created_at timestamptz not null default now()
);

create table public.class_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  section_id uuid references public.course_sections(id) on delete set null,
  weekday smallint check (weekday between 0 and 6),
  start_time time,
  end_time time,
  room text,
  session_type public.session_type not null default 'lecture',
  created_at timestamptz not null default now()
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  parent_topic_id uuid references public.topics(id) on delete set null,
  title text not null,
  description text,
  topic_kind text not null default 'curriculum',
  confidence numeric(5,2) check (confidence between 0 and 100),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  topic_id uuid references public.topics(id) on delete set null,
  title text not null,
  markdown text not null default '',
  editor_json jsonb,
  tags text[] not null default '{}',
  lecture_date date,
  review_stage integer not null default 0,
  next_review_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.note_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  note_id uuid not null references public.notes(id) on delete cascade,
  block_key text,
  block_type text,
  content text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  resource_type text not null,
  url text,
  storage_path text,
  mime_type text,
  extracted_text text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  due_at timestamptz,
  weight numeric(6,3) not null default 0,
  score numeric(6,3),
  status public.assessment_status not null default 'not-started',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  topic_id uuid references public.topics(id) on delete set null,
  source_note_id uuid references public.notes(id) on delete set null,
  card_type public.flashcard_type not null default 'standard',
  prompt text not null,
  answer text not null,
  generated_by_ai boolean not null default false,
  source_provenance jsonb not null default '{}'::jsonb,
  -- FSRS-ready state
  due_at timestamptz not null default now(),
  stability double precision,
  difficulty double precision,
  elapsed_days integer,
  scheduled_days integer,
  reps integer not null default 0,
  lapses integer not null default 0,
  state smallint,
  last_review_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.flashcard_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  flashcard_id uuid not null references public.flashcards(id) on delete cascade,
  rating smallint not null check (rating between 1 and 4),
  duration_ms integer,
  before_state jsonb,
  after_state jsonb,
  reviewed_at timestamptz not null default now()
);

create table public.practice_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  topic_id uuid references public.topics(id) on delete set null,
  question_type text not null,
  prompt text not null,
  solution text,
  difficulty text,
  generated_by_ai boolean not null default false,
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.practice_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.practice_questions(id) on delete cascade,
  response text,
  correct boolean,
  score numeric(6,3),
  feedback text,
  attempted_at timestamptz not null default now()
);

create table public.mistakes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  topic_id uuid references public.topics(id) on delete set null,
  flashcard_id uuid references public.flashcards(id) on delete set null,
  practice_question_id uuid references public.practice_questions(id) on delete set null,
  label text not null,
  miss_count integer not null default 1,
  last_missed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  mode text not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  cards_reviewed integer not null default 0,
  questions_attempted integer not null default 0,
  recall_score numeric(6,3),
  metadata jsonb not null default '{}'::jsonb
);

create table public.ai_context_exports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  export_kind text not null,
  context_markdown text not null,
  selection jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index notes_course_updated_idx on public.notes(course_id, updated_at desc);
create index cards_due_idx on public.flashcards(user_id, due_at);
create index assessments_due_idx on public.assessments(user_id, due_at);
create index mistakes_course_idx on public.mistakes(course_id, miss_count desc);
create index resources_course_idx on public.resources(course_id, created_at desc);

-- Row-level security: every row is private to its owner.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'semesters','courses','course_sections','class_sessions','topics','notes','note_blocks',
    'resources','assessments','flashcards','flashcard_reviews','practice_questions',
    'practice_attempts','mistakes','study_sessions','ai_context_exports'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format(
      'create policy %I on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      table_name || '_owner_policy', table_name
    );
  end loop;
end $$;
-- Study OS cloud-sync compatibility migration.
-- Adds stable client IDs so local browser objects can be synced without replacing
-- their IDs with database UUIDs. Safe to run after 0001_initial.sql.

alter table public.notes add column if not exists client_id text;
alter table public.flashcards add column if not exists client_id text;
alter table public.flashcards add column if not exists source_note_client_id text;
alter table public.flashcards add column if not exists last_rating text;
alter table public.assessments add column if not exists client_id text;
alter table public.resources add column if not exists client_id text;
alter table public.mistakes add column if not exists client_id text;
alter table public.mistakes add column if not exists flashcard_client_id text;

update public.notes set client_id = id::text where client_id is null;
update public.flashcards set client_id = id::text where client_id is null;
update public.assessments set client_id = id::text where client_id is null;
update public.resources set client_id = id::text where client_id is null;
update public.mistakes set client_id = id::text where client_id is null;

alter table public.notes alter column client_id set not null;
alter table public.flashcards alter column client_id set not null;
alter table public.assessments alter column client_id set not null;
alter table public.resources alter column client_id set not null;
alter table public.mistakes alter column client_id set not null;

create unique index if not exists notes_user_client_id_key on public.notes(user_id, client_id);
create unique index if not exists flashcards_user_client_id_key on public.flashcards(user_id, client_id);
create unique index if not exists assessments_user_client_id_key on public.assessments(user_id, client_id);
create unique index if not exists resources_user_client_id_key on public.resources(user_id, client_id);
create unique index if not exists mistakes_user_client_id_key on public.mistakes(user_id, client_id);
