-- Remove legacy demo submissions that were previously used to populate the MVP.
-- Real submissions are kept; this only targets the known example submitter
-- emails from the old seed data.

delete from public.submissions
where submitted_by is null
  and submitter_email in (
    'maya@example.com',
    'theo@example.com',
    'priya@example.com',
    'sam@example.com',
    'noor@example.com',
    'lin@example.com'
  );
