type SubmissionWithSubmitterEmail = {
  submitter_email?: string | null;
};

export const DEMO_SUBMITTER_EMAILS = new Set([
  "maya@example.com",
  "theo@example.com",
  "priya@example.com",
  "sam@example.com",
  "noor@example.com",
  "lin@example.com",
]);

export function isRealSubmission<T extends SubmissionWithSubmitterEmail>(
  submission: T,
): boolean {
  const email = submission.submitter_email?.trim().toLowerCase();
  return !email || !DEMO_SUBMITTER_EMAILS.has(email);
}

export function filterRealSubmissions<T extends SubmissionWithSubmitterEmail>(
  submissions: T[],
): T[] {
  return submissions.filter(isRealSubmission);
}
