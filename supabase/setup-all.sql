-- =============================================================================
-- DS Gap Insights — full database setup (run once in Supabase SQL Editor)
-- Project: https://supabase.com/dashboard/project/xxrouryrsamjihukcagu/sql/new
-- =============================================================================
-- Creates: submissions, submission_images, analysis_runs, storage bucket, RLS
-- Seeds:   ~20 demo submissions (skipped if you already have 5+ rows)
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

-- =============================================================================
-- SEED (below) — demo submissions for dashboard / AI demos
-- =============================================================================
do $$
begin
  if (select count(*) from public.submissions) >= 5 then
    raise notice 'Seed skipped: submissions table already has data.';
    return;
  end if;

  insert into public.submissions (
    submitted_by, submitter_email, team, component_name, title,
    problem_description, use_case, why_insufficient, proposed_support,
    gap_type, frequency_impact, figma_url, storybook_url, open_questions
  ) values
  -- Pattern 1: Button loading state across three product teams (cross-team, high impact)
  (
    null, 'maya@example.com', 'Checkout', 'Button',
    'Button needs a loading state with a custom label',
    'Async checkout actions can take 2-3 seconds. Our Button has no built-in loading state, so we either disable it (users think it broke) or leave the label unchanged (users double-click).',
    'Checkout: "Place order", "Confirm payment", "Apply coupon" - any button that triggers an async API call.',
    'Adding our own spinner inside the Button breaks the icon slot. Disabling alone is not enough - users need feedback that something is happening.',
    'Add a `loading` boolean prop and an optional `loadingLabel` so we can swap the label while keeping the same width.',
    'missing_state', 'blocking', null, null, 'Should the loading state announce to screen readers automatically?'
  ),
  (
    null, 'theo@example.com', 'Onboarding', 'Button',
    'Submit buttons need loading + success transition states',
    'Multi-step onboarding has lots of forms. Without loading feedback, users often submit twice and break the flow.',
    'Account setup, email verification step, plan selection step.',
    'We do not own the Button styles, so we cannot consistently add a spinner without forking.',
    'A `loading` prop plus an optional momentary `success` state would let the whole onboarding flow feel coherent.',
    'missing_state', 'frequent', null, null, null
  ),
  (
    null, 'priya@example.com', 'Reports & Analytics', 'Button',
    'Loading state for long-running export buttons',
    'Generating a report can take 5-15 seconds. The Button just sits there and users click again.',
    'Reports list page, dashboard share button, every export action.',
    'We are simulating loading by swapping the icon, but the button width jumps and breaks our layout.',
    'A `loading` prop that preserves the button width.',
    'missing_state', 'frequent', null, null, null
  ),
  -- Pattern 2: Modal layout limitation across two teams
  (
    null, 'theo@example.com', 'Reports & Analytics', 'Modal',
    'Modal cannot host a side-by-side filter + preview layout',
    'Our "Build a report" flow benefits from a left filter panel and a right preview. The current Modal forces a single content column and a fixed max-width.',
    'Report builder, audience picker, export configurator.',
    'We tried embedding our own grid inside the Modal body, but the Modal max-width clips the preview and the close button overlaps the filter header.',
    'Either a Modal `size="wide"` variant with a two-pane layout slot, or a separate Drawer-style component.',
    'layout_limitation', 'frequent', 'https://www.figma.com/file/example/reports', null, 'Open: do we need a new Drawer component, or is wide Modal enough?'
  ),
  (
    null, 'sam@example.com', 'Settings & Admin', 'Modal',
    'Settings forms need a Modal that can scroll a long body',
    'Our role-permissions Modal has 20+ checkboxes. The current Modal does not scroll its body, so the submit button gets pushed off-screen.',
    'Workspace permissions, integration settings, API key creation.',
    'Workaround: we add `overflow-y: auto` ourselves, but the header/footer no longer stay sticky.',
    'A Modal with built-in sticky header/footer and a scrollable body region.',
    'layout_limitation', 'frequent', null, null, null
  ),
  -- Pattern 3: Toast accessibility issue across mobile + onboarding
  (
    null, 'maya@example.com', 'Mobile Apps', 'Toast',
    'Toast not announced to screen readers on iOS',
    'Toast notifications appear visually but VoiceOver does not read them. Multiple a11y testers have flagged this.',
    'Form errors, save confirmations, network status changes.',
    'We tried wrapping in role="status" ourselves but it duplicates the announcement on Android.',
    'Built-in `aria-live` polite/assertive variant on Toast, picked correctly per severity.',
    'accessibility', 'blocking', null, null, 'Does the DS already handle this on web and just not on mobile?'
  ),
  (
    null, 'priya@example.com', 'Onboarding', 'Toast',
    'Error Toasts disappear before screen readers finish reading them',
    'Our success/error Toasts auto-dismiss after 3s. For screen reader users this is sometimes faster than the announcement.',
    'Onboarding error states (invalid invite code, expired magic link).',
    'We extended the duration for errors, but that creates inconsistent behavior across teams.',
    'Auto-dismiss should pause until the assistive technology announcement completes, or at least extend automatically for assertive Toasts.',
    'accessibility', 'occasional', null, null, null
  ),
  -- Pattern 4: Input error state inconsistency across teams
  (
    null, 'noor@example.com', 'Checkout', 'Input',
    'Inline validation messaging is inconsistent with Input border state',
    'Inputs turn red on error but the helper text below uses a different red, sometimes a different size, and the focus ring color is unchanged.',
    'Card number, billing address, coupon code fields.',
    'We can only style the error message, not the Input border. The two look like they were designed separately.',
    'A single `error` prop on Input that controls border, focus ring, helper-text color, and icon together.',
    'semantic_styling', 'frequent', null, 'https://storybook.example.com/?path=/story/forms-input--with-error', null
  ),
  (
    null, 'sam@example.com', 'Settings & Admin', 'Input',
    'Input error state lacks an icon, breaking scannability',
    'Forms with many fields look noisy because the error border alone is not enough; we add our own ⚠ icon inline.',
    'API key creation, profile settings, security settings.',
    'No icon slot in the current error state.',
    'A standard error icon inside Input, consistent with the Toast error style.',
    'missing_variant', 'occasional', null, null, null
  ),
  -- Pattern 5: Card semantic styling (single team, blocking - documentation gap risk)
  (
    null, 'noor@example.com', 'Growth', 'Card',
    'Card has no semantic tone variants (info, warning, success)',
    'Marketing surfaces use a lot of color-coded summary cards. We end up forking Card with our own background colors.',
    'Pricing page comparison, plan recommendation cards, in-app promo banners.',
    'The current Card only supports neutral background.',
    'Add `tone="info" | "warning" | "success" | "neutral"` with proper text contrast tokens.',
    'missing_variant', 'frequent', null, null, null
  ),
  -- One-off product needs
  (
    null, 'lin@example.com', 'Marketing Site', 'Tabs',
    'Tabs need vertical orientation for marketing comparison sections',
    'Long pricing comparison reads better in a vertical tabs layout. The DS Tabs only support horizontal.',
    'Pricing comparison, feature deep-dives.',
    'Horizontal Tabs do not work at narrow widths.',
    'A vertical orientation variant for Tabs.',
    'missing_variant', 'one_off', null, null, null
  ),
  (
    null, 'lin@example.com', 'Mobile Apps', 'DatePicker',
    'DatePicker does not support a range with two visible months',
    'Booking flows feel cramped with a single-month picker.',
    'Trip booking, vacation rental search.',
    'We are using a third-party range picker which fights our other DS components on focus styles.',
    'A range variant for DatePicker.',
    'missing_variant', 'occasional', null, null, null
  ),
  -- Documentation / guidance gaps
  (
    null, 'priya@example.com', 'Reports & Analytics', 'Banner',
    'No guidance on when to use Banner vs Toast vs inline Alert',
    'Our team keeps flip-flopping. We end up reviewing the same decision every quarter.',
    'Dashboard messaging, billing nudges, system status.',
    'Components exist but the docs do not explain when each is appropriate.',
    'A short decision tree in the docs: persistence, severity, dismissibility.',
    'usage_guidance', 'frequent', null, null, null
  ),
  (
    null, 'maya@example.com', 'Checkout', 'Tooltip',
    'Tooltip vs Popover usage is unclear',
    'Both look similar in our docs. Designers pick whichever ships first.',
    'Form field hints, table column explanations, inline help icons.',
    'No content guidance about when each is appropriate or what content goes inside.',
    'Better docs: when to use, max content length, accessibility implications.',
    'usage_guidance', 'occasional', null, null, null
  ),
  -- Other gap types
  (
    null, 'theo@example.com', 'Onboarding', 'Combobox',
    'Combobox needs an "add new" affordance',
    'Many onboarding flows need user-supplied options (team names, role labels) that may not be in the seed list.',
    'Team picker on onboarding, custom tag input on profile setup.',
    'We are working around by using two inputs and a "+ add new" link, which is inconsistent with everywhere else Combobox is used.',
    'A built-in pattern for "type to add a new value" inside Combobox.',
    'missing_interaction', 'occasional', null, null, null
  ),
  (
    null, 'sam@example.com', 'Settings & Admin', 'Table',
    'Table needs row selection + bulk action toolbar pattern',
    'Settings tables (members, API keys, roles) all need multi-select with an action toolbar that appears when items are selected.',
    'Workspace members, integrations list, API tokens.',
    'Every team is rebuilding this. The pattern is not in the DS.',
    'A documented composition or built-in support for row selection + bulk action toolbar.',
    'missing_interaction', 'frequent', null, null, null
  ),
  (
    null, 'noor@example.com', 'Growth', 'Skeleton',
    'Skeleton variants do not match real component layouts',
    'Our Skeleton boxes only roughly approximate the components they replace, so users see jarring jumps when content lands.',
    'Plan list, recommendation card grid, billing summary.',
    'We end up shaping our own skeleton blocks per surface.',
    'Per-component Skeleton presets (CardSkeleton, ListItemSkeleton, etc.) that match the real layout.',
    'missing_variant', 'occasional', null, null, null
  ),
  (
    null, 'lin@example.com', 'Marketing Site', 'Tooltip',
    'Tooltip on touch devices opens then immediately closes',
    'Tap targets that show a Tooltip on hover do not work on iOS/Android.',
    'Pricing page feature explanations, comparison icons.',
    'Tooltip behavior assumes hover.',
    'A touch-friendly variant or guidance to swap to Popover at tap targets.',
    'missing_interaction', 'frequent', null, null, null
  ),
  (
    null, 'theo@example.com', 'Onboarding', 'Stepper',
    'Stepper does not visually express optional steps',
    'Our onboarding has optional steps that users can skip; the Stepper shows them as if they are still required.',
    'Onboarding stepper, profile completion stepper.',
    'No `optional` state on Stepper.',
    'An `optional` flag per Step that renders subtly differently.',
    'missing_state', 'occasional', null, null, null
  ),
  (
    null, 'maya@example.com', 'Checkout', 'Form',
    'No documented pattern for inline-field-level retry on async validation',
    'Coupon codes and address verification are validated server-side. We need a consistent retry/loading pattern on the field.',
    'Coupon entry, address validation.',
    'We invented our own approach. Likely diverges from other teams doing the same.',
    'Documentation + a small helper for "field with async validation".',
    'usage_guidance', 'occasional', null, null, null
  );

  raise notice 'Seeded % example submissions.', (select count(*) from public.submissions);
end $$;
