import { SetupNotice } from "@/components/app/setup-notice";
import { RecentSubmissions } from "@/components/submission/recent-submissions";
import { SubmissionForm } from "@/components/submission/submission-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import type { Submission } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Submit a gap | DS Gap Insights",
};

export default async function SubmitPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Submit a gap</h1>
          <p className="max-w-prose text-sm text-muted-foreground">
            Tell the DS team what is missing or unclear. The more specific your
            submission, the more useful the AI dashboard becomes for everyone.
          </p>
        </header>
        <SetupNotice />
      </div>
    );
  }

  const user = await requireUser("/submit");
  const supabase = await createClient();
  const { data: recent } = await supabase
    .from("submissions")
    .select("id, title, component_name, team, gap_type, created_at")
    .eq("submitted_by", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const recentSubmissions = (recent ?? []) as Pick<
    Submission,
    "id" | "title" | "component_name" | "team" | "gap_type" | "created_at"
  >[];

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Submit a gap
          </h1>
          <p className="max-w-prose text-sm text-muted-foreground">
            Tell the DS team what is missing or unclear. The more specific your
            submission, the more useful the AI dashboard becomes for everyone.
          </p>
        </header>
        <SubmissionForm
          user={{ id: user.id, email: user.email ?? null }}
        />
      </div>
      <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
        <h2 className="text-sm font-medium">Your recent submissions</h2>
        <RecentSubmissions submissions={recentSubmissions} />
      </aside>
    </div>
  );
}
