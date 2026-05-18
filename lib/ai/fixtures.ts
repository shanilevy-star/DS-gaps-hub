// Deterministic fixture analyzer. Given any set of submissions, returns a
// plausible AnalysisOutput by grouping on component_name and applying simple
// heuristics. Used as the default mode so the dashboard is demoable without
// any LLM key, and as a fallback when live mode fails.

import { frequencyImpactLabel } from "@/lib/constants/frequency-impact";
import { gapTypeLabel } from "@/lib/constants/gap-types";
import type { Submission } from "@/lib/types";
import {
  classifySufficiency,
  type AnalysisGroup,
  type AnalysisOutput,
  type AnalysisRecommendation,
  type Confidence,
  type GapClassification,
  type ImpactSignal,
  type SuggestedAction,
} from "./types";

type SubmissionLite = Pick<
  Submission,
  | "id"
  | "title"
  | "component_name"
  | "team"
  | "gap_type"
  | "frequency_impact"
  | "submitter_email"
  | "problem_description"
  | "created_at"
>;

const HIGH_IMPACT_FREQUENCY = new Set(["frequent", "blocking"]);

export function generateFixtureAnalysis(
  submissions: SubmissionLite[],
): AnalysisOutput {
  const total = submissions.length;
  const sufficiency = classifySufficiency(total);

  // Quantitative aggregates, separate from grouping.
  const componentCounts = countBy(submissions, (s) => s.component_name);
  const gapTypeCounts = countBy(submissions, (s) => s.gap_type);

  // Group by normalized component name, tie-break by gap_type.
  const buckets = new Map<string, SubmissionLite[]>();
  for (const submission of submissions) {
    const key = submission.component_name.trim().toLowerCase();
    if (!key) continue;
    const bucket = buckets.get(key) ?? [];
    bucket.push(submission);
    buckets.set(key, bucket);
  }

  const minGroupSize = total < 5 ? 1 : 2;
  const groups: AnalysisGroup[] = Array.from(buckets.entries())
    .map(([, items]) => buildGroup(items))
    .filter((group) => group.submission_ids.length >= minGroupSize)
    .sort((a, b) => b.submission_ids.length - a.submission_ids.length)
    .slice(0, 8);

  const recommendations = buildRecommendations(groups);

  return {
    overall_summary: buildOverallSummary({
      total,
      groups,
      sufficiency,
      componentCounts,
    }),
    data_sufficiency: sufficiency,
    data_sufficiency_note: buildSufficiencyNote(total, groups.length),
    groups,
    recommendations,
    most_requested_components: componentCounts
      .slice(0, 5)
      .map(([component, count]) => ({ component, count })),
    most_common_gap_types: gapTypeCounts
      .slice(0, 5)
      .map(([gap_type, count]) => ({
        gap_type: gapTypeLabel(gap_type),
        count,
      })),
  };
}

function buildGroup(items: SubmissionLite[]): AnalysisGroup {
  const componentName = items[0].component_name.trim();
  const teamsSet = new Set(items.map((i) => i.team.trim()));
  const crossTeam = teamsSet.size > 1;

  const topGapType = pickMajority(items, (i) => i.gap_type);
  const highImpactCount = items.filter((i) =>
    HIGH_IMPACT_FREQUENCY.has(i.frequency_impact),
  ).length;
  const impactRatio = highImpactCount / items.length;
  const impact: ImpactSignal =
    impactRatio >= 0.5 ? "high" : impactRatio >= 0.25 ? "medium" : "low";

  const classification: GapClassification =
    topGapType === "usage_guidance"
      ? "documentation_or_guidance"
      : topGapType === "missing_variant" || topGapType === "missing_state"
        ? "missing_variant_or_state"
        : items.length === 1 && !crossTeam
          ? "one_off_product_need"
          : "true_component_gap";

  const teamsLabel = Array.from(teamsSet).slice(0, 3).join(", ");
  const rationale =
    items.length === 1
      ? `Single submission about ${componentName}. ${gapTypeLabel(topGapType)} reported by ${items[0].team}.`
      : crossTeam
        ? `${items.length} submissions about ${componentName} across ${teamsSet.size} teams (${teamsLabel}). Common shape: ${gapTypeLabel(topGapType)}.`
        : `${items.length} submissions about ${componentName} from ${teamsLabel}. Consistently a ${gapTypeLabel(topGapType).toLowerCase()} issue.`;

  const title =
    items.length === 1
      ? items[0].title
      : `${componentName}: ${gapTypeLabel(topGapType).toLowerCase()}${crossTeam ? ` across ${teamsSet.size} teams` : ""}`;

  return {
    id: `grp-${componentName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${topGapType}`,
    title,
    submission_ids: items.map((i) => i.id),
    rationale,
    gap_classification: classification,
    cross_team: crossTeam,
    impact_signal: impact,
  };
}

function buildRecommendations(
  groups: AnalysisGroup[],
): AnalysisRecommendation[] {
  return groups.slice(0, 4).map((group, index) => {
    const action: SuggestedAction =
      group.gap_classification === "documentation_or_guidance"
        ? "docs_update"
        : group.gap_classification === "missing_variant_or_state"
          ? group.title.toLowerCase().includes("state")
            ? "new_state"
            : "new_variant"
          : group.gap_classification === "one_off_product_need"
            ? "needs_discovery"
            : "new_component";

    const confidence: Confidence =
      group.submission_ids.length >= 4 && group.cross_team
        ? "high"
        : group.submission_ids.length >= 2
          ? "medium"
          : "low";

    return {
      id: `rec-${index + 1}`,
      title: titleForRecommendation(group, action),
      rationale: `Backed by ${group.submission_ids.length} submission${group.submission_ids.length === 1 ? "" : "s"}${
        group.cross_team ? " across multiple teams" : ""
      }. ${
        group.impact_signal === "high"
          ? "Several submitters flagged this as frequent or blocking."
          : group.impact_signal === "medium"
            ? "Reported as a recurring need."
            : "Likely a smaller-scope improvement."
      }`,
      suggested_action: action,
      confidence,
      related_group_ids: [group.id],
    };
  });
}

function titleForRecommendation(
  group: AnalysisGroup,
  action: SuggestedAction,
): string {
  switch (action) {
    case "new_variant":
      return `Add a new variant for ${capitalize(group.title.split(":")[0] ?? "this component")}`;
    case "new_state":
      return `Add the missing state to ${capitalize(group.title.split(":")[0] ?? "this component")}`;
    case "new_component":
      return `Consider a new DS component for ${capitalize(group.title.split(":")[0] ?? "this need")}`;
    case "docs_update":
      return `Clarify usage guidance for ${capitalize(group.title.split(":")[0] ?? "this component")}`;
    case "needs_discovery":
      return `Investigate ${capitalize(group.title.split(":")[0] ?? "this request")} before committing`;
    default:
      return group.title;
  }
}

function buildOverallSummary({
  total,
  groups,
  sufficiency,
  componentCounts,
}: {
  total: number;
  groups: AnalysisGroup[];
  sufficiency: "low" | "medium" | "high";
  componentCounts: Array<[string, number]>;
}): string {
  if (total === 0) {
    return "No submissions yet. Once designers start submitting gaps, this summary will highlight the most common patterns and recurring needs.";
  }
  if (sufficiency === "low") {
    return `${total} submission${total === 1 ? "" : "s"} so far. Too early to draw strong conclusions, but early signals point to ${componentCounts[0]?.[0] ?? "a few components"}.`;
  }
  const top = componentCounts
    .slice(0, 3)
    .map(([name]) => name)
    .join(", ");
  const crossTeamGroups = groups.filter((g) => g.cross_team);
  if (crossTeamGroups.length === 0) {
    return `${total} submissions across the team. Most requests concentrate on ${top}. No strong cross-team patterns yet - most needs look product-specific.`;
  }
  return `${total} submissions across ${new Set(groups.flatMap((g) => g.submission_ids.map((id) => id))).size > 0 ? "" : ""}several teams. ${crossTeamGroups.length} cross-team pattern${crossTeamGroups.length === 1 ? "" : "s"} stand${crossTeamGroups.length === 1 ? "s" : ""} out, mostly around ${top}. The recommendations below are ranked by signal strength.`.replace(
    "  ",
    " ",
  );
}

function buildSufficiencyNote(total: number, groupCount: number): string {
  if (total === 0) {
    return "Zero submissions. Encourage your team to submit through /submit.";
  }
  if (total < 5) {
    return `Only ${total} submission${total === 1 ? "" : "s"}. Treat any grouping as a hypothesis, not a conclusion.`;
  }
  if (total < 12) {
    return `${total} submissions is enough to surface ${groupCount} preliminary group${groupCount === 1 ? "" : "s"}. Trends will sharpen as more come in.`;
  }
  return `${total} submissions is a reasonable base. Groupings are more reliable above 4 submissions per pattern.`;
}

function countBy<T>(
  items: T[],
  pick: (item: T) => string,
): Array<[string, number]> {
  const map = new Map<string, number>();
  for (const item of items) {
    const key = pick(item).trim();
    if (!key) continue;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
}

function pickMajority<T>(items: T[], pick: (item: T) => string): string {
  return countBy(items, pick)[0]?.[0] ?? "";
}

function capitalize(s: string): string {
  if (!s) return s;
  return s[0].toUpperCase() + s.slice(1);
}

// Re-export so the prompt module can hint about labels.
export { frequencyImpactLabel as _frequencyImpactLabel };
