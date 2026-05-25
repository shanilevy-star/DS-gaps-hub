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
import { formatRelativeShort } from "@/lib/format";
import type { Submission } from "@/lib/types";

type SubmissionTableRow = Pick<
  Submission,
  | "id"
  | "title"
  | "component_name"
  | "team"
  | "gap_type"
  | "frequency_impact"
  | "submitter_email"
  | "created_at"
> &
  Partial<Pick<Submission, "submitted_by">>;

export function SubmissionsTable({
  submissions,
  currentUserId = null,
}: {
  submissions: SubmissionTableRow[];
  currentUserId?: string | null;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-[40%]">Title</TableHead>
            <TableHead>Component</TableHead>
            <TableHead>Team</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Frequency</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead className="w-px">
              <span className="sr-only">Actions</span>
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
              <TableCell className="align-top text-right">
                {currentUserId && submission.submitted_by === currentUserId ? (
                  <SubmissionRowActions
                    submissionId={submission.id}
                    title={submission.title}
                  />
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
