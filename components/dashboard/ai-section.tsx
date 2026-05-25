"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  RecommendationsList,
  type RecommendationTaskStatus,
} from "@/components/dashboard/recommendations-list";
import { Button } from "@/components/ui/button";
import { formatRelativeShort } from "@/lib/format";
import type { AnalysisRun } from "@/lib/ai/types";
import type { Submission } from "@/lib/types";

const TASK_STORAGE_KEY = "ds-gap-insights:recommendation-tasks";
const RECOMMENDATION_PREVIEW_LIMIT = 4;

export function AiSection({
  initialRun,
  submissionsForGrouping,
  totalSubmissions,
}: {
  initialRun: AnalysisRun | null;
  submissionsForGrouping: Pick<
    Submission,
    "id" | "title" | "team" | "component_name"
  >[];
  totalSubmissions: number;
}) {
  const router = useRouter();
  const [run, setRun] = useState<AnalysisRun | null>(initialRun);
  const [submitting, setSubmitting] = useState(false);
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);
  const [taskStatuses, setTaskStatuses] = useState<
    Record<string, RecommendationTaskStatus>
  >({});
  const [taskStateLoaded, setTaskStateLoaded] = useState(false);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(TASK_STORAGE_KEY);
        if (stored) {
          setTaskStatuses(JSON.parse(stored));
        }
      } catch {
        // Local task state is best-effort only.
      } finally {
        setTaskStateLoaded(true);
      }
    }, 0);
    return () => window.clearTimeout(handle);
  }, []);

  useEffect(() => {
    if (!taskStateLoaded) return;
    try {
      window.localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(taskStatuses));
    } catch {
      // Ignore storage failures; recommendations still work in-session.
    }
  }, [taskStateLoaded, taskStatuses]);

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

  const activeRecommendations = useMemo(
    () =>
      run?.payload.recommendations.filter(
        (rec) => taskStatuses[rec.id] !== "Dismissed",
      ) ?? [],
    [run, taskStatuses],
  );

  const visibleRecommendations = showAllRecommendations
    ? activeRecommendations
    : activeRecommendations.slice(0, RECOMMENDATION_PREVIEW_LIMIT);
  const hiddenRecommendationCount = Math.max(
    0,
    activeRecommendations.length - RECOMMENDATION_PREVIEW_LIMIT,
  );

  function updateTaskStatus(
    id: string,
    status: RecommendationTaskStatus,
  ) {
    setTaskStatuses((current) => ({ ...current, [id]: status }));
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
            <Sparkles className="size-4 text-muted-foreground" aria-hidden />
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
              <>
                Last analyzed {formatRelativeShort(run.created_at)} across{" "}
                {run.input_count} submission{run.input_count === 1 ? "" : "s"}.
                {isStale ? (
                  <span className="ml-1 text-amber-700 dark:text-amber-400">
                    {totalSubmissions - run.input_count} new since then.
                  </span>
                ) : null}
              </>
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
            groupsById={groupsById}
            submissionsById={submissionsById}
            onAddToTask={(id) => updateTaskStatus(id, "Open")}
            onTaskStatusChange={updateTaskStatus}
            onDismiss={(id) => updateTaskStatus(id, "Dismissed")}
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
        </div>
      )}
    </section>
  );
}
