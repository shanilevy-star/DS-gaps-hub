"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronDown, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { aiPriorityLabel, type AiPriority } from "@/lib/constants/priority";
import { taskStatusLabel, type TaskStatus } from "@/lib/tasks";
import { cn } from "@/lib/utils";
import type {
  AnalysisGroup,
  AnalysisRecommendation,
} from "@/lib/ai/types";
import type { Submission } from "@/lib/types";

type SupportingSubmission = Pick<
  Submission,
  "id" | "title" | "team" | "component_name" | "is_blocking"
>;

const PRIORITY_BADGE_CLASS: Record<AiPriority, string> = {
  critical:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300",
  high:
    "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/30 dark:text-orange-300",
  medium:
    "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-900/60 dark:bg-yellow-950/30 dark:text-yellow-300",
  low: "border-border bg-muted text-muted-foreground",
};

export function RecommendationsList({
  recommendations,
  taskStatuses,
  addingTaskId,
  groupsById,
  submissionsById,
  onAddToTask,
  onDismiss,
}: {
  recommendations: AnalysisRecommendation[];
  taskStatuses: Record<string, TaskStatus>;
  addingTaskId?: string | null;
  groupsById: Map<string, AnalysisGroup>;
  submissionsById: Map<
    string,
    Pick<Submission, "id" | "title" | "team" | "component_name" | "is_blocking">
  >;
  onAddToTask: (recommendation: AnalysisRecommendation) => void;
  onDismiss: (id: string) => void;
}) {
  if (recommendations.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No recommended fixes to show from the current analysis. Dismissed items
        are hidden from this list.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {recommendations.map((rec) => {
        const relatedGroups = rec.related_group_ids
          .map((id) => groupsById.get(id))
          .filter((group): group is AnalysisGroup => Boolean(group));
        const supportingSubmissions = getSupportingSubmissions(
          relatedGroups,
          submissionsById,
        );
        const priority = rec.priority ?? "medium";

        return (
          <li
            key={rec.id}
            className="rounded-lg border border-border bg-card p-5 shadow-md shadow-foreground/5"
          >
            <div className="min-w-0 space-y-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-base font-semibold leading-snug">
                    {rec.title}
                  </h4>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] uppercase",
                      PRIORITY_BADGE_CLASS[priority],
                    )}
                  >
                    AI priority: {aiPriorityLabel(priority)}
                  </Badge>
                </div>
                <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {rec.rationale}
                </p>
              </div>

              {supportingSubmissions.length > 0 ? (
                <SupportingSubmittedGaps submissions={supportingSubmissions} />
              ) : null}

              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                {taskStatuses[rec.id] ? (
                  <Badge
                    variant="secondary"
                    className="inline-flex h-8 items-center gap-1.5 px-3 text-xs"
                  >
                    <CheckCircle2 className="size-3.5" aria-hidden />
                    In tasks: {taskStatusLabel(taskStatuses[rec.id])}
                  </Badge>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    disabled={addingTaskId === rec.id}
                    onClick={() => onAddToTask(rec)}
                  >
                    <Plus className="mr-1 size-3.5" aria-hidden />
                    {addingTaskId === rec.id ? "Adding..." : "Add to tasks"}
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => onDismiss(rec.id)}
                >
                  <X className="mr-1 size-3.5" aria-hidden />
                  Dismiss
                </Button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function getSupportingSubmissions(
  groups: AnalysisGroup[],
  submissionsById: Map<string, SupportingSubmission>,
): SupportingSubmission[] {
  const seenSubmissionIds = new Set<string>();
  const submissions: SupportingSubmission[] = [];

  for (const group of groups) {
    for (const id of group.submission_ids) {
      if (seenSubmissionIds.has(id)) continue;
      const submission = submissionsById.get(id);
      if (!submission) continue;
      seenSubmissionIds.add(id);
      submissions.push(submission);
    }
  }

  return submissions;
}

function SupportingSubmittedGaps({
  submissions,
}: {
  submissions: SupportingSubmission[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-md border border-border bg-muted/20 p-3">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 text-left text-xs font-semibold text-muted-foreground hover:text-foreground"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>Supporting submitted gaps ({submissions.length})</span>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 transition-transform",
            isOpen && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      {isOpen ? (
        <ul className="mt-2.5 list-disc space-y-1 pl-5">
          {submissions.map((submission) => (
            <li key={submission.id} className="text-xs text-muted-foreground">
              <Link
                href={`/submissions/${submission.id}?from=dashboard-ai`}
                className="hover:text-foreground hover:underline"
              >
                {submission.title}{" "}
                <span className="text-muted-foreground/70">
                  ({submission.team})
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
