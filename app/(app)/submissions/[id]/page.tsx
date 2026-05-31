import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { SetupNotice } from "@/components/app/setup-notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ImageGallery } from "@/components/submissions/image-gallery";
import { frameworkLabel } from "@/lib/constants/frameworks";
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
    title: `Submission ${id.slice(0, 8)} | DS Gap Hub`,
  };
}

export default async function SubmissionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const backHref = from === "dashboard-ai" ? "/dashboard#ai-insights" : "/submissions";
  const backLabel =
    from === "dashboard-ai" ? "Back to AI insights" : "Back to submissions";

  if (!isSupabaseConfigured()) {
    return (
      <div className="space-y-6">
        <BackLink href={backHref} label={backLabel} />
        <SetupNotice />
      </div>
    );
  }

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
      <BackLink href={backHref} label={backLabel} />

      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{gapTypeLabel(submission.gap_type)}</Badge>
          <Badge variant="outline">
            {frequencyImpactLabel(submission.frequency_impact)}
          </Badge>
          <Badge variant="outline">{frameworkLabel(submission.framework)}</Badge>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {submission.title}
        </h1>
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
          <DetailMetaItem label="Component" value={submission.component_name} />
          <DetailMetaItem
            label="Framework"
            value={frameworkLabel(submission.framework)}
          />
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
        <DetailSection title="Where this is needed">
          {submission.use_case}
        </DetailSection>
        {submission.why_insufficient ? (
          <DetailSection title="Why the current component is insufficient">
            {submission.why_insufficient}
          </DetailSection>
        ) : null}
        {submission.proposed_support ? (
          <DetailSection title="Proposed support needed">
            {submission.proposed_support}
          </DetailSection>
        ) : null}
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

function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Button asChild variant="ghost" size="sm" className="-ml-3">
      <Link href={href}>
        <ArrowLeft className="mr-1 size-3.5" aria-hidden />
        {label}
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
