import Link from "next/link";
import { EmptyState } from "@/components/app/empty-state";
import { SetupNotice } from "@/components/app/setup-notice";
import { Button } from "@/components/ui/button";
import { AiSection } from "@/components/dashboard/ai-section";
import { CountBars } from "@/components/dashboard/count-bars";
import { StatCard } from "@/components/dashboard/stat-card";
import { SubmissionsTable } from "@/components/submissions/submissions-table";
import type { AnalysisOutput, AnalysisRun } from "@/lib/ai/types";
import { computeDashboardStats } from "@/lib/analytics";
import { GAP_TYPES } from "@/lib/constants/gap-types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Submission } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Gap prioritization dashboard | DS Gap Hub",
};

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

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Gap prioritization dashboard
          </h1>
          <p className="max-w-prose text-sm text-muted-foreground">
            Track submitted DS gaps, repeated patterns, and AI-recommended
            fixes.
          </p>
        </header>
        <SetupNotice />
      </div>
    );
  }

  const supabase = await createClient();
  const [submissionsResult, latestRunResult] = await Promise.all([
    supabase
      .from("submissions")
      .select(
        "id, title, component_name, team, gap_type, frequency_impact, submitter_email, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("analysis_runs")
      .select("id, created_at, input_count, payload, mode")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (submissionsResult.error) {
    return (
      <div className="space-y-6">
        <DashboardHeader />
        <EmptyState
          title="Couldn't load the dashboard"
          description={submissionsResult.error.message}
        />
      </div>
    );
  }

  const submissions = (submissionsResult.data ?? []) as SubmissionLite[];
  const latestRun: AnalysisRun | null = latestRunResult.data
    ? {
        id: latestRunResult.data.id,
        created_at: latestRunResult.data.created_at,
        input_count: latestRunResult.data.input_count,
        mode: latestRunResult.data.mode as "fixtures" | "live",
        payload:
          latestRunResult.data.payload as unknown as AnalysisOutput,
      }
    : null;

  if (submissions.length === 0) {
    return (
      <div className="space-y-6">
        <DashboardHeader />
        <EmptyState
          title="No submissions yet"
          description="Once designers start submitting gaps, this dashboard will summarize them and surface patterns."
          action={
            <Button asChild size="sm">
              <Link href="/submit">Submit the first gap</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const stats = computeDashboardStats(submissions);
  const gapTypeNameToValue = new Map(GAP_TYPES.map((g) => [g.label, g.value]));
  const recentSubmissions = submissions.slice(0, 8);

  return (
    <div className="space-y-8">
      <DashboardHeader />

      <section
        aria-labelledby="totals-heading"
        className="space-y-3"
      >
        <h2 id="totals-heading" className="sr-only">
          Totals
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total submissions" value={stats.total} />
          <StatCard
            label="New in last 7 days"
            value={stats.newInLastWeek}
            hint={
              stats.newInLastWeek === 0
                ? "Quiet week"
                : stats.newInLastWeek === 1
                  ? "1 fresh submission"
                  : `${stats.newInLastWeek} fresh submissions`
            }
          />
          <StatCard
            label="Distinct components"
            value={stats.uniqueComponents}
            hint="Across all submissions"
          />
          <StatCard
            label="Teams contributing"
            value={stats.uniqueTeams}
            hint="Higher means broader interest"
          />
        </div>
      </section>

      <section
        aria-labelledby="patterns-heading"
        className="space-y-3"
      >
        <h2
          id="patterns-heading"
          className="text-base font-medium"
        >
          Patterns
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          <CountBars
            title="Most requested components"
            entries={stats.mostRequestedComponents}
            linkBuilder={(entry) =>
              `/submissions?component=${encodeURIComponent(entry.name)}`
            }
          />
          <CountBars
            title="Most common gap types"
            entries={stats.mostCommonGapTypes}
            linkBuilder={(entry) => {
              const value = gapTypeNameToValue.get(entry.name);
              return value
                ? `/submissions?gap_type=${encodeURIComponent(value)}`
                : "/submissions";
            }}
          />
          <CountBars
            title="Submissions by team"
            entries={stats.teamDistribution}
            linkBuilder={(entry) =>
              `/submissions?team=${encodeURIComponent(entry.name)}`
            }
          />
        </div>
      </section>

      <AiSection
        initialRun={latestRun}
        submissionsForGrouping={submissions.map((s) => ({
          id: s.id,
          title: s.title,
          team: s.team,
          component_name: s.component_name,
        }))}
        totalSubmissions={submissions.length}
      />

      <section
        aria-labelledby="recent-heading"
        className="space-y-3"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id="recent-heading" className="text-base font-medium">
            Recently submitted
          </h2>
          <Button asChild size="sm" variant="ghost">
            <Link href="/submissions">View all</Link>
          </Button>
        </div>
        <SubmissionsTable submissions={recentSubmissions} />
      </section>
    </div>
  );
}

function DashboardHeader() {
  return (
    <header className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">
        Gap prioritization dashboard
      </h1>
      <p className="max-w-prose text-sm text-muted-foreground">
        Track submitted DS gaps, repeated patterns, and AI-recommended fixes.
      </p>
    </header>
  );
}
