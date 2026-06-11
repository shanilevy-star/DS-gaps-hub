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
  is_blocking boolean,
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
  check (framework is null or framework in ('angular', 'react', 'angular|react'));

alter table public.submissions
  add column if not exists is_blocking boolean;

create index if not exists submissions_created_at_idx
  on public.submissions (created_at desc);
create index if not exists submissions_team_idx
  on public.submissions (team);
create index if not exists submissions_component_idx
  on public.submissions (component_name);
create index if not exists submissions_gap_type_idx
  on public.submissions (gap_type);
create index if not exists submissions_is_blocking_idx
  on public.submissions (is_blocking);

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

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  source_analysis_run_id uuid references public.analysis_runs(id) on delete set null,
  source_recommendation_id text not null,
  title text not null,
  rationale text not null,
  priority text not null,
  related_group_ids text[] not null default '{}',
  status text not null default 'open',
  jira_issue_id text,
  jira_issue_key text,
  jira_issue_url text,
  jira_status text,
  jira_synced_at timestamptz,
  constraint tasks_priority_check
    check (priority in ('critical', 'high', 'medium', 'low')),
  constraint tasks_status_check
    check (status in ('open', 'planned', 'in_review', 'done', 'dismissed')),
  constraint tasks_title_not_blank_check
    check (length(btrim(title)) > 0),
  constraint tasks_source_recommendation_unique
    unique (source_analysis_run_id, source_recommendation_id)
);

create index if not exists tasks_status_idx
  on public.tasks (status);
create index if not exists tasks_priority_idx
  on public.tasks (priority);
create index if not exists tasks_created_at_idx
  on public.tasks (created_at desc);
create index if not exists tasks_source_analysis_run_idx
  on public.tasks (source_analysis_run_id);

create or replace function public.set_tasks_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
before update on public.tasks
for each row
execute function public.set_tasks_updated_at();

-- =============================================================
-- Row Level Security
-- =============================================================

alter table public.submissions enable row level security;
alter table public.submission_images enable row level security;
alter table public.analysis_runs enable row level security;
alter table public.tasks enable row level security;

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

drop policy if exists "tasks_select_authenticated" on public.tasks;
create policy "tasks_select_authenticated"
  on public.tasks for select
  to authenticated
  using (true);

drop policy if exists "tasks_insert_authenticated" on public.tasks;
create policy "tasks_insert_authenticated"
  on public.tasks for insert
  to authenticated
  with check (created_by = auth.uid() or created_by is null);

drop policy if exists "tasks_update_authenticated" on public.tasks;
create policy "tasks_update_authenticated"
  on public.tasks for update
  to authenticated
  using (true)
  with check (true);

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
