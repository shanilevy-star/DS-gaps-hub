"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AiBadge } from "@/components/dashboard/ai-badge";
import { GroupsList } from "@/components/dashboard/groups-list";
import { RecommendationsList } from "@/components/dashboard/recommendations-list";
import { SufficiencyCallout } from "@/components/dashboard/sufficiency-callout";
import { Button } from "@/components/ui/button";
import { formatRelativeShort } from "@/lib/format";
import type { AnalysisRun } from "@/lib/ai/types";
import type { Submission } from "@/lib/types";

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
  const [showLowConfidenceRecs, setShowLowConfidenceRecs] = useState(false);

  async function handleRun() {
    setSubmitting(true);
    try {
      const response = await fetch("/api/analyze", { method: "POST" });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.error ?? "Analysis failed.");
      }
      setRun(body.run as AnalysisRun);
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

  const isStale =
    run &&
    totalSubmissions > 0 &&
    run.input_count !== totalSubmissions;

  return (
    <section
      aria-labelledby="ai-section-heading"
      className="space-y-5 rounded-xl border border-border bg-muted/20 p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-muted-foreground" aria-hidden />
            <h2 id="ai-section-heading" className="text-base font-medium">
              AI summary
            </h2>
            {run ? <AiBadge mode={run.mode} /> : null}
          </div>
          <p className="text-xs text-muted-foreground">
            {run ? (
              <>
                Last run {formatRelativeShort(run.created_at)} over{" "}
                {run.input_count} submission
                {run.input_count === 1 ? "" : "s"}.
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
          {submitting ? "Running..." : run ? "Re-run analysis" : "Run analysis"}
        </Button>
      </div>

      {!run ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
          {totalSubmissions === 0
            ? "Once submissions land, run the analysis to see grouping and recommendations."
            : "Run the analysis to summarize patterns across all submissions, group similar gaps, and surface recommendations."}
        </div>
      ) : (
        <div className="space-y-5">
          <p className="text-base leading-relaxed">
            {run.payload.overall_summary}
          </p>

          <SufficiencyCallout
            sufficiency={run.payload.data_sufficiency}
            note={run.payload.data_sufficiency_note}
          />

          {run.payload.recommendations.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-medium">Recommendations</h3>
                {run.payload.data_sufficiency === "low" &&
                run.payload.recommendations.some(
                  (r) => r.confidence === "low",
                ) ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setShowLowConfidenceRecs((v) => !v)
                    }
                  >
                    {showLowConfidenceRecs
                      ? "Hide low-confidence"
                      : "Show low-confidence"}
                  </Button>
                ) : null}
              </div>
              <RecommendationsList
                recommendations={run.payload.recommendations.filter(
                  (r) =>
                    run.payload.data_sufficiency !== "low" ||
                    showLowConfidenceRecs ||
                    r.confidence !== "low",
                )}
              />
            </div>
          ) : null}

          <div className="space-y-3">
            <h3 className="text-sm font-medium">Groups</h3>
            <GroupsList
              groups={run.payload.groups}
              submissionsById={submissionsById}
            />
          </div>
        </div>
      )}
    </section>
  );
}
