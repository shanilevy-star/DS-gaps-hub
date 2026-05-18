import { gapTypeLabel } from "@/lib/constants/gap-types";
import type { Submission } from "@/lib/types";

type SubmissionLite = Pick<
  Submission,
  | "id"
  | "title"
  | "component_name"
  | "team"
  | "gap_type"
  | "frequency_impact"
  | "submitter_email"
  | "created_at"
>;

export type CountEntry = { name: string; count: number; share: number };

export type DashboardStats = {
  total: number;
  newInLastWeek: number;
  uniqueComponents: number;
  uniqueTeams: number;
  mostRequestedComponents: CountEntry[];
  mostCommonGapTypes: CountEntry[];
  teamDistribution: CountEntry[];
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function computeDashboardStats(
  submissions: SubmissionLite[],
  now: Date = new Date(),
): DashboardStats {
  const total = submissions.length;
  const cutoff = now.getTime() - WEEK_MS;
  const newInLastWeek = submissions.filter(
    (s) => new Date(s.created_at).getTime() >= cutoff,
  ).length;

  const componentCounts = countBy(submissions, (s) => s.component_name);
  const gapTypeCounts = countBy(submissions, (s) => s.gap_type);
  const teamCounts = countBy(submissions, (s) => s.team);

  return {
    total,
    newInLastWeek,
    uniqueComponents: componentCounts.length,
    uniqueTeams: teamCounts.length,
    mostRequestedComponents: toEntries(componentCounts, total).slice(0, 5),
    mostCommonGapTypes: toEntries(
      gapTypeCounts.map(([name, count]) => [gapTypeLabel(name), count]),
      total,
    ).slice(0, 6),
    teamDistribution: toEntries(teamCounts, total),
  };
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

function toEntries(
  pairs: Array<[string, number]>,
  total: number,
): CountEntry[] {
  if (total === 0) return [];
  return pairs.map(([name, count]) => ({
    name,
    count,
    share: count / total,
  }));
}
