import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SetupNotice } from "@/components/app/setup-notice";
import { SubmissionForm } from "@/components/submission/submission-form";
import { Button } from "@/components/ui/button";
import { submissionToFormValues } from "@/lib/submission-form-values";
import { requireUser } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Submission } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return {
    title: `Edit submission ${id.slice(0, 8)} | DS Gap Hub`,
  };
}

export default async function EditSubmissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto w-full max-w-xl space-y-10 pt-2 pb-28 sm:space-y-12">
        <BackLink id={id} />
        <SetupNotice />
      </div>
    );
  }

  const user = await requireUser(`/submissions/${id}/edit`);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const submission = data as Submission;
  if (submission.submitted_by !== user.id) {
    redirect(`/submissions/${id}`);
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-10 pt-2 pb-28 sm:space-y-12">
      <BackLink id={id} />
      <header className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Edit submission
        </h1>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          Update the details for this gap. Existing screenshots stay attached.
        </p>
      </header>
      <SubmissionForm
        user={{ id: user.id, email: user.email ?? null }}
        mode="edit"
        submissionId={submission.id}
        initialValues={submissionToFormValues(submission)}
        cancelHref={`/submissions/${submission.id}`}
      />
    </div>
  );
}

function BackLink({ id }: { id: string }) {
  return (
    <Button asChild variant="ghost" size="sm" className="-ml-3">
      <Link href={`/submissions/${id}`}>
        <ArrowLeft className="mr-1 size-3.5" aria-hidden />
        Back to submission
      </Link>
    </Button>
  );
}
