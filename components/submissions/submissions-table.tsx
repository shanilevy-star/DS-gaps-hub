import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SubmissionRowActions } from "@/components/submissions/submission-row-actions";
import { frequencyImpactLabel } from "@/lib/constants/frequency-impact";
import { gapTypeLabel } from "@/lib/constants/gap-types";
import { blockingLabel } from "@/lib/constants/priority";
import { formatRelativeShort } from "@/lib/format";
import type { Submission } from "@/lib/types";

type SubmissionTableRow = Pick<
  Submission,
  | "id"
  | "title"
  | "component_name"
  | "is_blocking"
  | "team"
  | "gap_type"
  | "frequency_impact"
  | "submitter_email"
  | "created_at"
> &
  Partial<Pick<Submission, "submitted_by">>;

const ACTION_COLUMN_WIDTH = "w-14 min-w-14 max-w-14";

export function SubmissionsTable({
  submissions,
  currentUserId = null,
}: {
  submissions: SubmissionTableRow[];
  currentUserId?: string | null;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-right text-[11px] text-muted-foreground/70">
        Scroll to view more
      </p>
      <div className="relative overflow-hidden rounded-lg border border-border bg-card">
        <Table className="min-w-[980px] border-separate border-spacing-0">
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[40%]">Title</TableHead>
              <TableHead>Component</TableHead>
              <TableHead>Blocking</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead
                className={`${ACTION_COLUMN_WIDTH} sticky right-0 z-30 overflow-hidden border-l border-border/70 bg-muted p-0 shadow-[-8px_0_14px_-14px_rgba(0,0,0,0.45)]`}
              >
                <span
                  aria-hidden
                  className="absolute inset-0 bg-muted"
                />
                <span className="relative z-10 sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map((submission) => (
              <TableRow
                key={submission.id}
                className="group"
              >
                <TableCell className="align-top">
                  <Link
                    href={`/submissions/${submission.id}`}
                    className="font-medium hover:underline"
                  >
                    {submission.title}
                  </Link>
                  {submission.submitter_email ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      by {submission.submitter_email}
                    </p>
                  ) : null}
                </TableCell>
                <TableCell className="align-top text-sm">
                  {submission.component_name}
                </TableCell>
                <TableCell className="align-top">
                  {submission.is_blocking === true ? (
                    <Badge variant="destructive" className="text-xs">
                      Blocking
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {blockingLabel(submission.is_blocking)}
                    </span>
                  )}
                </TableCell>
                <TableCell className="align-top text-sm text-muted-foreground">
                  {submission.team}
                </TableCell>
                <TableCell className="align-top">
                  <Badge variant="secondary" className="text-xs">
                    {gapTypeLabel(submission.gap_type)}
                  </Badge>
                </TableCell>
                <TableCell className="align-top text-sm text-muted-foreground">
                  {frequencyImpactLabel(submission.frequency_impact)}
                </TableCell>
                <TableCell className="align-top text-sm text-muted-foreground whitespace-nowrap">
                  {formatRelativeShort(submission.created_at)}
                </TableCell>
                <TableCell
                  className={`${ACTION_COLUMN_WIDTH} sticky right-0 z-10 overflow-hidden border-l border-border/70 bg-card p-0 align-top text-right shadow-[-8px_0_14px_-14px_rgba(0,0,0,0.45)]`}
                >
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-card group-hover:bg-muted/50"
                  />
                  <span className="relative z-10 flex min-h-12 items-start justify-end p-2">
                    {currentUserId && submission.submitted_by === currentUserId ? (
                      <SubmissionRowActions
                        submissionId={submission.id}
                        title={submission.title}
                      />
                    ) : (
                      <span
                        aria-hidden
                        className="inline-block size-8"
                      />
                    )}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
