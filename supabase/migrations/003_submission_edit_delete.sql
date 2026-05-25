-- Allow users to edit and delete their own submissions.
-- Image rows cascade when a submission is deleted; storage objects are removed
-- by the app before deleting the row.

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

drop policy if exists "submission_images_delete_storage_own" on storage.objects;
create policy "submission_images_delete_storage_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'submission-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
