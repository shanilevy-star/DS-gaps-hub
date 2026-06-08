-- Track whether a submitted gap is currently blocking project delivery.
-- Nullable keeps existing submissions valid until they are edited.

alter table public.submissions
  add column if not exists is_blocking boolean;

create index if not exists submissions_is_blocking_idx
  on public.submissions (is_blocking);
