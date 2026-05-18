import Link from "next/link";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type {
  AnalysisGroup,
  GapClassification,
  ImpactSignal,
} from "@/lib/ai/types";
import type { Submission } from "@/lib/types";

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

export function GroupsList({
  groups,
  submissionsById,
}: {
  groups: AnalysisGroup[];
  submissionsById: Map<
    string,
    Pick<Submission, "id" | "title" | "team" | "component_name">
  >;
}) {
  if (groups.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No repeated patterns detected yet.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {groups.map((group) => {
        const hydratedSubmissions = group.submission_ids
          .map((id) => submissionsById.get(id))
          .filter(
            (
              s,
            ): s is Pick<Submission, "id" | "title" | "team" | "component_name"> =>
              Boolean(s),
          );
        const filterComponent = hydratedSubmissions[0]?.component_name;
        return (
          <li
            key={group.id}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 space-y-1">
                <h4 className="text-sm font-medium leading-snug">
                  {group.title}
                </h4>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="secondary" className="text-[10px]">
                    {CLASSIFICATION_LABEL[group.gap_classification]}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {IMPACT_LABEL[group.impact_signal]}
                  </Badge>
                  {group.cross_team ? (
                    <Badge variant="outline" className="text-[10px]">
                      <Users className="mr-1 size-3" aria-hidden />
                      Cross-team
                    </Badge>
                  ) : null}
                </div>
              </div>
              <p className="shrink-0 text-xs text-muted-foreground">
                {group.submission_ids.length} submission
                {group.submission_ids.length === 1 ? "" : "s"}
              </p>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {group.rationale}
            </p>
            {hydratedSubmissions.length > 0 ? (
              <ul className="mt-3 space-y-1">
                {hydratedSubmissions.slice(0, 6).map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/submissions/${s.id}`}
                      className="block truncate text-xs text-muted-foreground hover:text-foreground hover:underline"
                    >
                      &middot; {s.title}{" "}
                      <span className="text-muted-foreground/70">
                        ({s.team})
                      </span>
                    </Link>
                  </li>
                ))}
                {hydratedSubmissions.length > 6 ? (
                  <li className="text-xs text-muted-foreground">
                    + {hydratedSubmissions.length - 6} more
                  </li>
                ) : null}
              </ul>
            ) : null}
            {filterComponent ? (
              <Link
                href={`/submissions?component=${encodeURIComponent(filterComponent)}`}
                className="mt-3 inline-flex text-xs font-medium text-foreground underline-offset-4 hover:underline"
              >
                View all {filterComponent} submissions
              </Link>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
