import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-8 px-6 py-16">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            DS Gap Hub
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Submit, review, and prioritize design system gaps across product
            teams.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/submit"
            className="group flex h-full flex-col rounded-lg border border-border bg-card p-5 transition-colors hover:border-foreground/30"
          >
            <span className="text-sm font-medium">Submit a gap</span>
            <span className="mt-2 text-sm text-muted-foreground">
              Tell the DS team what is missing, where you need it, and why the
              current component falls short.
            </span>
            <span className="mt-auto pt-4 text-sm font-medium text-foreground/80 group-hover:text-foreground">
              Start a submission &rarr;
            </span>
          </Link>
          <Link
            href="/dashboard"
            className="group flex h-full flex-col rounded-lg border border-border bg-card p-5 transition-colors hover:border-foreground/30"
          >
            <span className="text-sm font-medium">Open the dashboard</span>
            <span className="mt-2 text-sm text-muted-foreground">
              See AI-generated summaries, groupings, and recommendations across
              all submissions.
            </span>
            <span className="mt-auto pt-4 text-sm font-medium text-foreground/80 group-hover:text-foreground">
              View insights &rarr;
            </span>
          </Link>
        </div>
      </main>
    </>
  );
}
