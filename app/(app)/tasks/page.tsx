import Link from "next/link";
import { EmptyState } from "@/components/app/empty-state";
import { SetupNotice } from "@/components/app/setup-notice";
import { TasksTable } from "@/components/tasks/tasks-table";
import { Button } from "@/components/ui/button";
import { compareTasksByPriority, type DesignTask } from "@/lib/tasks";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tasks | DS Gap Hub",
};

export default async function TasksPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="space-y-6">
        <TasksHeader />
        <SetupNotice />
      </div>
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(
      "id, created_at, updated_at, created_by, source_analysis_run_id, source_recommendation_id, title, rationale, priority, related_group_ids, status, jira_issue_id, jira_issue_key, jira_issue_url, jira_status, jira_synced_at",
    )
    .neq("status", "dismissed")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return (
      <div className="space-y-6">
        <TasksHeader />
        <EmptyState
          title="Couldn't load tasks"
          description={error.message}
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/tasks">Retry</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const tasks = ((data ?? []) as DesignTask[]).sort(compareTasksByPriority);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <TasksHeader />
        <Button asChild size="sm" variant="outline">
          <Link href="/dashboard#ai-insights">Add from dashboard</Link>
        </Button>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          title="No tasks yet"
          description="Add AI recommendations from the dashboard to build the design team's task queue."
          action={
            <Button asChild size="sm">
              <Link href="/dashboard#ai-insights">Go to AI insights</Link>
            </Button>
          }
        />
      ) : (
        <TasksTable tasks={tasks} />
      )}

      <p className="text-xs text-muted-foreground">
        Showing {tasks.length} task{tasks.length === 1 ? "" : "s"}, sorted by
        priority.
      </p>
    </div>
  );
}

function TasksHeader() {
  return (
    <header className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
      <p className="max-w-prose text-sm text-muted-foreground">
        Centralized design-team work items created from AI recommendations.
      </p>
    </header>
  );
}
