"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { RecommendationsList } from "@/components/dashboard/recommendations-list";
import { Button } from "@/components/ui/button";
import { formatRelativeShort } from "@/lib/format";
import type { AnalysisRecommendation, AnalysisRun } from "@/lib/ai/types";
import type { AiPriority } from "@/lib/constants/priority";
import type { DesignTask, TaskStatus } from "@/lib/tasks";
import type { Submission } from "@/lib/types";

const RECOMMENDATION_PREVIEW_LIMIT = 4;
const PRIORITY_RANK: Record<AiPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function AiSection({
  initialRun,
  initialTaskStatuses,
  submissionsForGrouping,
  totalSubmissions,
}: {
  initialRun: AnalysisRun | null;
  initialTaskStatuses: Record<string, TaskStatus>;
  submissionsForGrouping: Pick<
    Submission,
    "id" | "title" | "team" | "component_name" | "is_blocking"
  >[];
  totalSubmissions: number;
}) {
  const router = useRouter();
  const [run, setRun] = useState<AnalysisRun | null>(initialRun);
  const [submitting, setSubmitting] = useState(false);
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);
  const [localTaskStatuses, setLocalTaskStatuses] = useState<
    Record<string, TaskStatus>
  >({});
  const [addingTaskId, setAddingTaskId] = useState<string | null>(null);
  const [dismissedRecommendationIds, setDismissedRecommendationIds] = useState<
    string[]
  >([]);

  async function handleRun() {
    setSubmitting(true);
    try {
      const response = await fetch("/api/analyze", { method: "POST" });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.error ?? "Analysis failed.");
      }
      setRun(body.run as AnalysisRun);
      setShowAllRecommendations(false);
      router.refresh();
      toast.success("Analysis updated.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Couldn't run analysis.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const submissionsById = new Map(
    submissionsForGrouping.map((s) => [s.id, s]),
  );
  const groupsById = new Map(
    run?.payload.groups.map((group) => [group.id, group]) ?? [],
  );

  const isStale =
    run &&
    totalSubmissions > 0 &&
    run.input_count !== totalSubmissions;
  const taskStatuses = useMemo(
    () => ({ ...initialTaskStatuses, ...localTaskStatuses }),
    [initialTaskStatuses, localTaskStatuses],
  );

  const activeRecommendations = useMemo(
    () =>
      (run?.payload.recommendations
        .filter((rec) => !dismissedRecommendationIds.includes(rec.id))
        .sort(compareRecommendationsByPriority) ?? []),
    [dismissedRecommendationIds, run],
  );

  const visibleRecommendations = showAllRecommendations
    ? activeRecommendations
    : activeRecommendations.slice(0, RECOMMENDATION_PREVIEW_LIMIT);
  const hiddenRecommendationCount = Math.max(
    0,
    activeRecommendations.length - RECOMMENDATION_PREVIEW_LIMIT,
  );

  async function handleAddToTask(recommendation: AnalysisRecommendation) {
    if (!run || taskStatuses[recommendation.id] || addingTaskId) return;

    setAddingTaskId(recommendation.id);
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceAnalysisRunId: run.id,
          sourceRecommendationId: recommendation.id,
          title: recommendation.title,
          rationale: recommendation.rationale,
          priority: recommendation.priority ?? "medium",
          relatedGroupIds: recommendation.related_group_ids,
        }),
      });
      const body = (await response.json()) as {
        task?: Pick<DesignTask, "status">;
        duplicate?: boolean;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(body.error ?? "Could not add task.");
      }

      setLocalTaskStatuses((current) => ({
        ...current,
        [recommendation.id]: body.task?.status ?? "open",
      }));
      toast.success(body.duplicate ? "Already in tasks." : "Added to tasks.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add task.");
    } finally {
      setAddingTaskId(null);
    }
  }

  return (
    <section
      id="ai-insights"
      aria-labelledby="ai-section-heading"
      className="space-y-4 rounded-xl border border-border bg-muted/20 p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 fill-current text-foreground" aria-hidden />
            <h2 id="ai-section-heading" className="text-base font-semibold">
              AI insights
              {run ? (
                <>
                  {" "}
                  - {activeRecommendations.length} recommended gap{" "}
                  {activeRecommendations.length === 1 ? "fix" : "fixes"}{" "}
                  identified
                </>
              ) : null}
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            {run ? (
              <span className="inline-flex flex-wrap items-center gap-2">
                <span>
                  Last analyzed {formatRelativeShort(run.created_at)} across{" "}
                  {run.input_count} submission{run.input_count === 1 ? "" : "s"}.
                </span>
                {isStale ? (
                  <span className="text-amber-700 dark:text-amber-400">
                    {totalSubmissions - run.input_count} new since then.
                  </span>
                ) : null}
              </span>
            ) : (
              "No analysis run yet."
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={run ? "outline" : "default"}
            onClick={handleRun}
            disabled={submitting || totalSubmissions === 0}
          >
            <RefreshCw
              className={`mr-1.5 size-3.5 ${submitting ? "animate-spin" : ""}`}
              aria-hidden
            />
            {submitting
              ? "Running..."
              : run
                ? "Re-run analysis"
                : "Run analysis"}
          </Button>
        </div>
      </div>

      {!run ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
          {totalSubmissions === 0
            ? "Once submissions land, run the analysis to find repeated opportunities."
            : "Run analysis to identify repeated opportunities and recommended next steps."}
        </div>
      ) : (
        <div className="space-y-4">
          <RecommendationsList
            recommendations={visibleRecommendations}
            taskStatuses={taskStatuses}
            addingTaskId={addingTaskId}
            groupsById={groupsById}
            submissionsById={submissionsById}
            onAddToTask={handleAddToTask}
            onDismiss={(id) =>
              setDismissedRecommendationIds((current) => [...current, id])
            }
          />

          {!showAllRecommendations && hiddenRecommendationCount > 0 ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setShowAllRecommendations(true)}
            >
              Show {hiddenRecommendationCount} more
            </Button>
          ) : showAllRecommendations &&
            activeRecommendations.length > RECOMMENDATION_PREVIEW_LIMIT ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setShowAllRecommendations(false)}
            >
              Show fewer
            </Button>
          ) : null}
          {Object.keys(taskStatuses).length > 0 ? (
            <Button asChild type="button" size="sm" variant="outline">
              <Link href="/tasks">View tasks</Link>
            </Button>
          ) : null}
        </div>
      )}
    </section>
  );
}

function compareRecommendationsByPriority(
  a: AnalysisRecommendation,
  b: AnalysisRecommendation,
) {
  const priorityDelta =
    PRIORITY_RANK[b.priority ?? "medium"] - PRIORITY_RANK[a.priority ?? "medium"];
  if (priorityDelta !== 0) return priorityDelta;
  return b.related_group_ids.length - a.related_group_ids.length;
}
