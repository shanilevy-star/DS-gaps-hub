import { SetupNotice } from "@/components/app/setup-notice";
import { SubmissionForm } from "@/components/submission/submission-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { requireUser } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Submit a gap | DS Gap Hub",
};

export default async function SubmitPage() {
  const pageIntro = (
    <header className="space-y-2 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Submit a gap</h1>
      <p className="mx-auto max-w-md text-sm text-muted-foreground">
        Report what is missing or not working as expected in the current
        Storybook design system components.
      </p>
    </header>
  );

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto w-full max-w-xl space-y-10 pt-2 pb-28 sm:space-y-12">
        {pageIntro}
        <SetupNotice />
      </div>
    );
  }

  const user = await requireUser("/submit");

  return (
    <div className="mx-auto w-full max-w-xl space-y-10 pt-2 pb-28 sm:space-y-12">
      {pageIntro}
      <SubmissionForm user={{ id: user.id, email: user.email ?? null }} />
    </div>
  );
}
