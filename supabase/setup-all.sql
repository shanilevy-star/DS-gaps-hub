-- =============================================================================
-- DS Gap Insights — full database setup (run once in Supabase SQL Editor)
-- Project: https://supabase.com/dashboard/project/xxrouryrsamjihukcagu/sql/new
-- =============================================================================
-- Creates: submissions, submission_images, analysis_runs, storage bucket, RLS
-- Seeds:   none. Submissions should be real user-submitted gaps only.
-- =============================================================================

-- DS Gap Insights schema. Run this once in your Supabase SQL editor.
-- Idempotent where reasonable so it's safe to re-run during prototyping.

-- =============================================================
-- Tables
-- =============================================================

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  submitted_by uuid references auth.users(id) on delete set null,
  submitter_email text,
  team text not null,
  component_name text not null,
  framework text,
  title text not null,
  problem_description text not null,
  use_case text not null,
  why_insufficient text not null,
  proposed_support text not null,
  gap_type text not null,
  frequency_impact text not null,
  figma_url text,
  storybook_url text,
  open_questions text
);

alter table public.submissions
  add column if not exists framework text;

alter table public.submissions
  drop constraint if exists submissions_framework_check;

alter table public.submissions
  add constraint submissions_framework_check
  check (framework is null or framework in ('angular', 'react'));

create index if not exists submissions_created_at_idx
  on public.submissions (created_at desc);
create index if not exists submissions_team_idx
  on public.submissions (team);
create index if not exists submissions_component_idx
  on public.submissions (component_name);
create index if not exists submissions_gap_type_idx
  on public.submissions (gap_type);

create table if not exists public.submission_images (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  storage_path text not null,
  caption text,
  position integer not null default 0
);

create index if not exists submission_images_submission_id_idx
  on public.submission_images (submission_id);

create table if not exists public.analysis_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  triggered_by uuid references auth.users(id) on delete set null,
  input_count integer not null,
  payload jsonb not null,
  mode text not null
);

create index if not exists analysis_runs_created_at_idx
  on public.analysis_runs (created_at desc);

-- =============================================================
-- Row Level Security
-- =============================================================

alter table public.submissions enable row level security;
alter table public.submission_images enable row level security;
alter table public.analysis_runs enable row level security;

drop policy if exists "submissions_select_authenticated" on public.submissions;
create policy "submissions_select_authenticated"
  on public.submissions for select
  to authenticated
  using (true);

drop policy if exists "submissions_insert_own" on public.submissions;
create policy "submissions_insert_own"
  on public.submissions for insert
  to authenticated
  with check (submitted_by = auth.uid());

drop policy if exists "submissions_update_own" on public.submissions;
create policy "submissions_update_own"
  on public.submissions for update
  to authenticated
  using (submitted_by = auth.uid())
  with check (submitted_by = auth.uid());

drop policy if exists "submissions_delete_own" on public.submissions;
create policy "submissions_delete_own"
  on public.submissions for delete
  to authenticated
  using (submitted_by = auth.uid());

drop policy if exists "submission_images_select_authenticated" on public.submission_images;
create policy "submission_images_select_authenticated"
  on public.submission_images for select
  to authenticated
  using (true);

drop policy if exists "submission_images_insert_for_own_submission" on public.submission_images;
create policy "submission_images_insert_for_own_submission"
  on public.submission_images for insert
  to authenticated
  with check (
    exists (
      select 1 from public.submissions s
      where s.id = submission_id and s.submitted_by = auth.uid()
    )
  );

drop policy if exists "submission_images_delete_for_own_submission" on public.submission_images;
create policy "submission_images_delete_for_own_submission"
  on public.submission_images for delete
  to authenticated
  using (
    exists (
      select 1 from public.submissions s
      where s.id = submission_id and s.submitted_by = auth.uid()
    )
  );

drop policy if exists "analysis_runs_select_authenticated" on public.analysis_runs;
create policy "analysis_runs_select_authenticated"
  on public.analysis_runs for select
  to authenticated
  using (true);

drop policy if exists "analysis_runs_insert_authenticated" on public.analysis_runs;
create policy "analysis_runs_insert_authenticated"
  on public.analysis_runs for insert
  to authenticated
  with check (triggered_by = auth.uid() or triggered_by is null);

-- =============================================================
-- Storage
-- =============================================================

insert into storage.buckets (id, name, public)
values ('submission-images', 'submission-images', false)
on conflict (id) do nothing;

drop policy if exists "submission_images_upload_authenticated" on storage.objects;
create policy "submission_images_upload_authenticated"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'submission-images');

drop policy if exists "submission_images_read_authenticated" on storage.objects;
create policy "submission_images_read_authenticated"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'submission-images');

drop policy if exists "submission_images_delete_storage_own" on storage.objects;
create policy "submission_images_delete_storage_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'submission-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
