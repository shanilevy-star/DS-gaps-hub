-- Centralized design-team tasks created from AI recommendations.
-- Jira fields are intentionally inert until the Jira MCP integration is built.

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

alter table public.tasks enable row level security;

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
