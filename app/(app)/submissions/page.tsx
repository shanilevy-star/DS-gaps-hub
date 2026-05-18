import Link from "next/link";
import { EmptyState } from "@/components/app/empty-state";
import { SetupNotice } from "@/components/app/setup-notice";
import { Button } from "@/components/ui/button";
import { SubmissionsFilters } from "@/components/submissions/filters";
import { SubmissionsTable } from "@/components/submissions/submissions-table";
import { GAP_TYPE_VALUES, type GapTypeValue } from "@/lib/constants/gap-types";
import { KNOWN_COMPONENTS } from "@/lib/constants/components";
import { TEAMS } from "@/lib/constants/teams";
import { getCurrentUser } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Submission } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Submissions | DS Gap Insights",
};

type SearchParams = {
  q?: string;
  team?: string;
  component?: string;
  gap_type?: string;
  scope?: string;
};

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Submissions</h1>
          <p className="max-w-prose text-sm text-muted-foreground">
            Every gap that designers have submitted, searchable and filterable.
          </p>
        </header>
        <SetupNotice />
      </div>
    );
  }

  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const team = params.team ?? "";
  const component = params.component ?? "";
  const gapTypeRaw = params.gap_type ?? "";
  const gapType: GapTypeValue | "" = (
    GAP_TYPE_VALUES as readonly string[]
  ).includes(gapTypeRaw)
    ? (gapTypeRaw as GapTypeValue)
    : "";
  const scope: "all" | "mine" = params.scope === "mine" ? "mine" : "all";

  const user = await getCurrentUser();
  const supabase = await createClient();

  let query = supabase
    .from("submissions")
    .select(
      "id, title, component_name, team, gap_type, frequency_impact, submitter_email, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (q) {
    const escaped = q.replace(/[%,]/g, " ");
    const pattern = `%${escaped}%`;
    query = query.or(
      `title.ilike.${pattern},problem_description.ilike.${pattern},use_case.ilike.${pattern}`,
    );
  }
  if (team) query = query.eq("team", team);
  if (component) query = query.eq("component_name", component);
  if (gapType) query = query.eq("gap_type", gapType);
  if (scope === "mine" && user) {
    query = query.eq("submitted_by", user.id);
  }

  const { data, error } = await query;
  if (error) {
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Submissions</h1>
        </header>
        <EmptyState
          title="Couldn't load submissions"
          description={error.message}
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/submissions">Retry</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const submissions = (data ?? []) as Pick<
    Submission,
    | "id"
    | "title"
    | "component_name"
    | "team"
    | "gap_type"
    | "frequency_impact"
    | "submitter_email"
    | "created_at"
  >[];

  const knownTeams = Array.from(
    new Set<string>([...TEAMS, ...submissions.map((s) => s.team)]),
  )
    .filter(Boolean)
    .sort();
  const knownComponents = Array.from(
    new Set<string>([
      ...KNOWN_COMPONENTS,
      ...submissions.map((s) => s.component_name),
    ]),
  )
    .filter(Boolean)
    .sort();

  const hasActiveFilters = Boolean(
    q || team || component || gapType || scope === "mine",
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Submissions</h1>
          <p className="max-w-prose text-sm text-muted-foreground">
            Every gap that designers have submitted, searchable and filterable.
          </p>
        </header>
        <Button asChild size="sm">
          <Link href="/submit">Submit a gap</Link>
        </Button>
      </div>

      <SubmissionsFilters
        options={{ teams: knownTeams, components: knownComponents }}
        initial={{ q, team, component, gapType, scope }}
        signedInUserId={user?.id ?? null}
      />

      {submissions.length === 0 ? (
        <EmptyState
          title={
            hasActiveFilters ? "No submissions match your filters" : "No submissions yet"
          }
          description={
            hasActiveFilters
              ? "Try removing a filter or broadening your search."
              : "Once designers start submitting gaps, they'll show up here."
          }
          action={
            <Button asChild size="sm">
              <Link href={hasActiveFilters ? "/submissions" : "/submit"}>
                {hasActiveFilters ? "Clear filters" : "Submit the first gap"}
              </Link>
            </Button>
          }
        />
      ) : (
        <SubmissionsTable submissions={submissions} />
      )}

      <p className="text-xs text-muted-foreground">
        Showing {submissions.length}{" "}
        submission{submissions.length === 1 ? "" : "s"}.
      </p>
    </div>
  );
}
