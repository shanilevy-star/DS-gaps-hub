import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SetupNotice() {
  return (
    <Card className="mx-auto max-w-2xl border-amber-300/60 bg-amber-50/50 dark:border-amber-400/30 dark:bg-amber-400/5">
      <CardHeader>
        <CardTitle className="text-base">
          Supabase isn&apos;t configured yet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          Submissions and authentication need a Supabase project. Once
          configured, this notice will disappear and the rest of the app will
          come online.
        </p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            Create a free Supabase project at{" "}
            <a
              href="https://supabase.com"
              className="underline underline-offset-4"
            >
              supabase.com
            </a>
            .
          </li>
          <li>
            Copy <code className="rounded bg-muted px-1 py-0.5">.env.example</code>{" "}
            to <code className="rounded bg-muted px-1 py-0.5">.env.local</code>{" "}
            and fill in your URL and anon key.
          </li>
          <li>
            Run the SQL in{" "}
            <code className="rounded bg-muted px-1 py-0.5">
              supabase/migrations/001_initial.sql
            </code>{" "}
            inside the Supabase SQL editor.
          </li>
          <li>
            Create a storage bucket named{" "}
            <code className="rounded bg-muted px-1 py-0.5">
              submission-images
            </code>{" "}
            (private).
          </li>
          <li>Restart the dev server.</li>
        </ol>
      </CardContent>
    </Card>
  );
}
