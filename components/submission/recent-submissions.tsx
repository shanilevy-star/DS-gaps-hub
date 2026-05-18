import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatRelativeShort } from "@/lib/format";
import { gapTypeLabel } from "@/lib/constants/gap-types";
import type { Submission } from "@/lib/types";

export function RecentSubmissions({
  submissions,
  emptyLabel = "Nothing yet. Your submissions will appear here.",
}: {
  submissions: Pick<
    Submission,
    "id" | "title" | "component_name" | "team" | "gap_type" | "created_at"
  >[];
  emptyLabel?: string;
}) {
  if (submissions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{emptyLabel}</p>
    );
  }
  return (
    <ul className="space-y-2">
      {submissions.map((submission) => (
        <li key={submission.id}>
          <Link
            href={`/submissions/${submission.id}`}
            className="group flex items-start justify-between gap-3 rounded-md border border-border bg-card px-3 py-2.5 transition-colors hover:border-foreground/30"
          >
            <div className="min-w-0 space-y-1">
              <p className="truncate text-sm font-medium group-hover:underline">
                {submission.title}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {submission.component_name} &middot; {submission.team}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1 text-right text-xs text-muted-foreground">
              <span>{formatRelativeShort(submission.created_at)}</span>
              <Badge variant="secondary" className="text-[10px]">
                {gapTypeLabel(submission.gap_type)}
              </Badge>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
