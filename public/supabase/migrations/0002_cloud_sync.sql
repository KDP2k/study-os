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
