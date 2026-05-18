import Link from "next/link";
import { AppFooter } from "@/components/app/app-footer";
import { PrototypeBadge } from "@/components/app/prototype-badge";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-8 px-6 py-16">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">
            DS Gap Insights
          </h1>
          <PrototypeBadge />
        </div>
        <p className="max-w-prose text-base text-muted-foreground">
          A focused internal tool for the design system team. Product designers
          submit component gaps through a structured form, and the DS team gets
          an AI-assisted dashboard that summarizes repeated requests and
          recommends what to prioritize.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/submit"
            className="group flex flex-col gap-2 rounded-lg border border-border bg-card p-5 transition-colors hover:border-foreground/30"
          >
            <span className="text-sm font-medium">Submit a gap</span>
            <span className="text-sm text-muted-foreground">
              Tell the DS team what is missing, where you need it, and why the
              current component falls short.
            </span>
            <span className="mt-2 text-sm font-medium text-foreground/80 group-hover:text-foreground">
              Start a submission &rarr;
            </span>
          </Link>
          <Link
            href="/dashboard"
            className="group flex flex-col gap-2 rounded-lg border border-border bg-card p-5 transition-colors hover:border-foreground/30"
          >
            <span className="text-sm font-medium">Open the dashboard</span>
            <span className="text-sm text-muted-foreground">
              See AI-generated summaries, groupings, and recommendations across
              all submissions.
            </span>
            <span className="mt-2 text-sm font-medium text-foreground/80 group-hover:text-foreground">
              View insights &rarr;
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Button asChild size="sm">
            <Link href="/submit">Submit a gap</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/submissions">Browse submissions</Link>
          </Button>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
