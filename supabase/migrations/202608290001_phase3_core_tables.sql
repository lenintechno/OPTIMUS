-- OPTIMUS Phase 3: core persistence and user isolation.
-- Apply with `supabase db push` or in the Supabase SQL editor before using
-- the profile/onboarding API.

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  target_language text not null check (target_language in ('en', 'es', 'fr', 'de', 'hi')),
  proficiency text not null check (proficiency in ('beginner', 'intermediate', 'advanced')),
  preferred_voice text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (char_length(display_name) <= 80),
  constraint profiles_preferred_voice_length check (char_length(preferred_voice) <= 255)
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  language text not null check (language in ('en', 'es', 'fr', 'de', 'hi')),
  proficiency text not null check (proficiency in ('beginner', 'intermediate', 'advanced')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  turn_count integer not null default 0 check (turn_count >= 0),
  summary text,
  constraint sessions_end_after_start check (ended_at is null or ended_at >= started_at)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  role text not null check (role in ('user', 'tutor')),
  content text not null,
  structured_feedback jsonb,
  created_at timestamptz not null default now(),
  constraint messages_feedback_only_for_tutor check (
    (role = 'tutor') or structured_feedback is null
  )
);

create table public.corrections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  session_id uuid not null references public.sessions (id) on delete cascade,
  message_id uuid not null references public.messages (id) on delete cascade,
  original_text text not null,
  corrected_text text not null,
  categories text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index sessions_user_id_started_at_idx on public.sessions (user_id, started_at desc);
create index messages_session_id_created_at_idx on public.messages (session_id, created_at);
create index corrections_user_id_idx on public.corrections (user_id);
create index corrections_categories_idx on public.corrections using gin (categories);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.messages enable row level security;
alter table public.corrections enable row level security;

create policy "profiles are accessible only by their owner"
on public.profiles for all to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "sessions are accessible only by their owner"
on public.sessions for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "messages are accessible through an owned session"
on public.messages for all to authenticated
using (
  exists (
    select 1 from public.sessions
    where sessions.id = messages.session_id
      and sessions.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.sessions
    where sessions.id = messages.session_id
      and sessions.user_id = (select auth.uid())
  )
);

create policy "corrections are accessible only by their owner and session"
on public.corrections for all to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.sessions
    where sessions.id = corrections.session_id
      and sessions.user_id = (select auth.uid())
  )
)
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.sessions
    where sessions.id = corrections.session_id
      and sessions.user_id = (select auth.uid())
  )
  and exists (
    select 1 from public.messages
    where messages.id = corrections.message_id
      and messages.session_id = corrections.session_id
  )
);
