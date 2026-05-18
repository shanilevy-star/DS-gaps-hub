import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { SetupNotice } from "@/components/app/setup-notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ImageGallery } from "@/components/submissions/image-gallery";
import { frequencyImpactLabel } from "@/lib/constants/frequency-impact";
import { gapTypeLabel } from "@/lib/constants/gap-types";
import { formatAbsolute, formatRelativeShort } from "@/lib/format";
import { signImageUrls } from "@/lib/storage";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Submission, SubmissionImage } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return {
    title: `Submission ${id.slice(0, 8)} | DS Gap Insights`,
  };
}

export default async function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="space-y-6">
        <BackLink />
        <SetupNotice />
      </div>
    );
  }

  const { id } = await params;
  const supabase = await createClient();

  const [{ data: submissionRow, error: submissionError }, { data: imageRows }] =
    await Promise.all([
      supabase.from("submissions").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("submission_images")
        .select("*")
        .eq("submission_id", id)
        .order("position", { ascending: true }),
    ]);

  if (submissionError || !submissionRow) {
    notFound();
  }

  const submission = submissionRow as Submission;
  const images = (imageRows ?? []) as SubmissionImage[];
  const signedImages = await signImageUrls(supabase, images);

  return (
    <article className="space-y-8">
      <BackLink />

      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{gapTypeLabel(submission.gap_type)}</Badge>
          <Badge variant="outline">
            {frequencyImpactLabel(submission.frequency_impact)}
          </Badge>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {submission.title}
        </h1>
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
          <DetailMetaItem label="Component" value={submission.component_name} />
          <DetailMetaItem label="Team" value={submission.team} />
          <DetailMetaItem
            label="Submitted"
            value={
              <span title={formatAbsolute(submission.created_at)}>
                {formatRelativeShort(submission.created_at)}
                {submission.submitter_email ? (
                  <span className="text-muted-foreground">
                    {" "}
                    by {submission.submitter_email}
                  </span>
                ) : null}
              </span>
            }
          />
        </dl>
      </header>

      <Separator />

      <section className="space-y-6">
        <DetailSection title="Problem description">
          {submission.problem_description}
        </DetailSection>
        <DetailSection title="Use case">{submission.use_case}</DetailSection>
        <DetailSection title="Why the current component is insufficient">
          {submission.why_insufficient}
        </DetailSection>
        <DetailSection title="Proposed support needed">
          {submission.proposed_support}
        </DetailSection>
        {submission.open_questions ? (
          <DetailSection title="Open questions / considerations">
            {submission.open_questions}
          </DetailSection>
        ) : null}
      </section>

      <Separator />

      <section className="space-y-3">
        <h2 className="text-base font-medium">Screenshots</h2>
        <ImageGallery images={signedImages} />
      </section>

      {submission.figma_url || submission.storybook_url ? (
        <section className="space-y-3">
          <h2 className="text-base font-medium">Linked references</h2>
          <ul className="space-y-2 text-sm">
            {submission.figma_url ? (
              <li>
                <ExternalLinkRow
                  label="Figma"
                  href={submission.figma_url}
                />
              </li>
            ) : null}
            {submission.storybook_url ? (
              <li>
                <ExternalLinkRow
                  label="Storybook"
                  href={submission.storybook_url}
                />
              </li>
            ) : null}
          </ul>
        </section>
      ) : null}
    </article>
  );
}

function BackLink() {
  return (
    <Button asChild variant="ghost" size="sm" className="-ml-3">
      <Link href="/submissions">
        <ArrowLeft className="mr-1 size-3.5" aria-hidden />
        Back to submissions
      </Link>
    </Button>
  );
}

function DetailMetaItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm">{value}</dd>
    </div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{children}</p>
    </div>
  );
}

function ExternalLinkRow({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground underline-offset-4 hover:underline"
    >
      {label}
      <ExternalLink className="size-3.5" aria-hidden />
    </a>
  );
}
