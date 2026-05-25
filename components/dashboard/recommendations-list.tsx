import Link from "next/link";
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  AnalysisGroup,
  AnalysisRecommendation,
  GapClassification,
  ImpactSignal,
  SuggestedAction,
} from "@/lib/ai/types";
import type { Submission } from "@/lib/types";

const ACTION_LABEL: Record<SuggestedAction, string> = {
  new_variant: "New variant",
  new_state: "New state",
  new_component: "New component",
  docs_update: "Docs / guidance",
  needs_discovery: "Needs discovery",
};

const CLASSIFICATION_LABEL: Record<GapClassification, string> = {
  true_component_gap: "Component gap",
  missing_variant_or_state: "Missing variant or state",
  documentation_or_guidance: "Docs / guidance",
  one_off_product_need: "One-off need",
};

const IMPACT_LABEL: Record<ImpactSignal, string> = {
  low: "Low impact",
  medium: "Medium impact",
  high: "High impact",
};

export type RecommendationTaskStatus =
  | "Open"
  | "In review"
  | "Planned"
  | "Done"
  | "Dismissed";

const TASK_STATUSES: RecommendationTaskStatus[] = [
  "Open",
  "In review",
  "Planned",
  "Done",
  "Dismissed",
];

export function RecommendationsList({
  recommendations,
  taskStatuses,
  groupsById,
  submissionsById,
  onAddToTask,
  onTaskStatusChange,
  onDismiss,
}: {
  recommendations: AnalysisRecommendation[];
  taskStatuses: Record<string, RecommendationTaskStatus>;
  groupsById: Map<string, AnalysisGroup>;
  submissionsById: Map<
    string,
    Pick<Submission, "id" | "title" | "team" | "component_name">
  >;
  onAddToTask: (id: string) => void;
  onTaskStatusChange: (id: string, status: RecommendationTaskStatus) => void;
  onDismiss: (id: string) => void;
}) {
  if (recommendations.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No active recommendations. Dismissed items are hidden from this list.
      </p>
    );
  }
  return (
    <ol className="space-y-3">
      {recommendations.map((rec, index) => {
        const relatedGroups = rec.related_group_ids
          .map((id) => groupsById.get(id))
          .filter((group): group is AnalysisGroup => Boolean(group));

        return (
          <li
            key={rec.id}
            className="rounded-lg border border-border bg-card p-5"
          >
            <div className="flex items-start gap-4">
              <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-medium tabular-nums">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1 space-y-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-base font-semibold leading-snug">
                      {rec.title}
                    </h4>
                    <Badge variant="outline" className="text-[10px] uppercase">
                      {ACTION_LABEL[rec.suggested_action]}
                    </Badge>
                  </div>
                  <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {rec.rationale}
                  </p>
                </div>

                {relatedGroups.length > 0 ? (
                  <div className="space-y-2.5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Supporting patterns
                    </p>
                    <div className="space-y-2">
                      {relatedGroups.map((group) => (
                        <SupportingPattern
                          key={group.id}
                          group={group}
                          submissionsById={submissionsById}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  {taskStatuses[rec.id] &&
                  taskStatuses[rec.id] !== "Dismissed" ? (
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      Task
                      <select
                        value={taskStatuses[rec.id]}
                        onChange={(event) =>
                          onTaskStatusChange(
                            rec.id,
                            event.target.value as RecommendationTaskStatus,
                          )
                        }
                        className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground"
                      >
                        {TASK_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => onAddToTask(rec.id)}
                    >
                      <Plus className="mr-1 size-3.5" aria-hidden />
                      Add to task
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => onDismiss(rec.id)}
                  >
                    <X className="mr-1 size-3.5" aria-hidden />
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function SupportingPattern({
  group,
  submissionsById,
}: {
  group: AnalysisGroup;
  submissionsById: Map<
    string,
    Pick<Submission, "id" | "title" | "team" | "component_name">
  >;
}) {
  const hydratedSubmissions = group.submission_ids
    .map((id) => submissionsById.get(id))
    .filter(
      (
        submission,
      ): submission is Pick<
        Submission,
        "id" | "title" | "team" | "component_name"
      > => Boolean(submission),
    );

  return (
    <div className="rounded-md border border-border bg-muted/30 p-3.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1.5">
          <h5 className="text-xs font-semibold leading-snug">{group.title}</h5>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-[10px]">
              {CLASSIFICATION_LABEL[group.gap_classification]}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {IMPACT_LABEL[group.impact_signal]}
            </Badge>
          </div>
        </div>
        <p className="shrink-0 text-xs text-muted-foreground">
          {group.submission_ids.length} submission
          {group.submission_ids.length === 1 ? "" : "s"}
        </p>
      </div>
      <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
        {group.rationale}
      </p>
      {hydratedSubmissions.length > 0 ? (
        <ul className="mt-2.5 space-y-1">
          {hydratedSubmissions.slice(0, 4).map((submission) => (
            <li key={submission.id}>
              <Link
                href={`/submissions/${submission.id}?from=dashboard-ai`}
                target="_blank"
                rel="noopener noreferrer"
                className="block truncate text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                &middot; {submission.title}{" "}
                <span className="text-muted-foreground/70">
                  ({submission.team})
                </span>
              </Link>
            </li>
          ))}
          {hydratedSubmissions.length > 4 ? (
            <li className="text-xs text-muted-foreground">
              + {hydratedSubmissions.length - 4} more
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
