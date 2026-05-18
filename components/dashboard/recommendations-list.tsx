import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  AnalysisRecommendation,
  Confidence,
  SuggestedAction,
} from "@/lib/ai/types";

const ACTION_LABEL: Record<SuggestedAction, string> = {
  new_variant: "New variant",
  new_state: "New state",
  new_component: "New component",
  docs_update: "Docs / guidance",
  needs_discovery: "Needs discovery",
};

const CONFIDENCE_TONE: Record<Confidence, string> = {
  low: "text-muted-foreground",
  medium: "",
  high: "",
};

export function RecommendationsList({
  recommendations,
}: {
  recommendations: AnalysisRecommendation[];
}) {
  if (recommendations.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Not enough signal for recommendations yet.
      </p>
    );
  }
  return (
    <ol className="space-y-3">
      {recommendations.map((rec, index) => (
        <li
          key={rec.id}
          className={cn(
            "rounded-lg border border-border bg-card p-4",
            CONFIDENCE_TONE[rec.confidence],
          )}
        >
          <div className="flex items-start gap-3">
            <span className="mt-1 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-medium tabular-nums">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-medium leading-snug">
                  {rec.title}
                </h4>
                <Badge variant="outline" className="text-[10px] uppercase">
                  {ACTION_LABEL[rec.suggested_action]}
                </Badge>
                <ConfidenceChip confidence={rec.confidence} />
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {rec.rationale}
              </p>
              {rec.related_group_ids.length > 0 ? (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <ArrowRight className="size-3" aria-hidden />
                  Based on{" "}
                  {rec.related_group_ids.length === 1
                    ? "1 group"
                    : `${rec.related_group_ids.length} groups`}{" "}
                  below.
                </p>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function ConfidenceChip({ confidence }: { confidence: Confidence }) {
  const styles: Record<Confidence, string> = {
    low: "bg-muted text-muted-foreground",
    medium: "bg-muted text-foreground",
    high: "bg-foreground text-background",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        styles[confidence],
      )}
    >
      {confidence} confidence
    </span>
  );
}
