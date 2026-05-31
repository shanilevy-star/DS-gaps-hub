-- Track which frontend framework a submitted gap applies to.
-- Nullable keeps existing submissions valid; the app requires this for new
-- and edited submissions.

alter table public.submissions
  add column if not exists framework text;

alter table public.submissions
  drop constraint if exists submissions_framework_check;

alter table public.submissions
  add constraint submissions_framework_check
  check (framework is null or framework in ('angular', 'react'));
