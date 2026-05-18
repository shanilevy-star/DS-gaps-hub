export function AppFooter() {
  return (
    <footer className="border-t border-border/80 bg-background/50">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 text-xs text-muted-foreground sm:px-6">
        <p>
          This is a prototype for the DS team. The UI uses shadcn/ui as
          scaffolding for review purposes only &mdash; it is not your design
          system.
        </p>
        <p>
          Submissions are stored in Supabase. AI analysis runs only when
          triggered from the dashboard.
        </p>
      </div>
    </footer>
  );
}
