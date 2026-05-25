# DS Gap Hub

Internal prototype for collecting and analyzing design system component gaps. Designers submit gaps through a structured form; the DS team gets an AI-assisted dashboard that summarizes repeated requests and recommends what to prioritize next.

This is a coded prototype, not a production app. The UI uses shadcn/ui as scaffolding for review purposes only and is intentionally not styled to look like a real DS. A persistent "Prototype" badge in the header reinforces this.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind v4 + shadcn/ui
- Supabase: Postgres, Storage, magic-link auth
- OpenAI (optional) for live AI analysis; fixtures by default

## Quick start

**Using project `xxrouryrsamjihukcagu`?** See **[SETUP.md](SETUP.md)** for step-by-step links to your [Supabase dashboard](https://supabase.com/dashboard/project/xxrouryrsamjihukcagu).

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create a Supabase project**

   - Go to <https://supabase.com> and create a free project.
   - In the SQL editor, paste and run `supabase/migrations/001_initial.sql`. This creates the tables, RLS policies, and the private `submission-images` storage bucket.
   - Optional but recommended for demos: paste and run `supabase/seed.sql` to insert ~20 example submissions across teams and components. The seed is idempotent (skipped if the table already has data).
   - In **Authentication → Providers**, make sure **Email** is enabled. Magic-link sign-in is on by default.
   - In **Authentication → URL Configuration**, add your local dev URL (e.g. `http://localhost:3000`) to the **Site URL** and to **Redirect URLs**.

3. **Configure environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Fill in:

   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your Supabase project settings.
   - `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS` (optional, comma-separated) to limit who can sign in.
   - `USE_AI_FIXTURES=true` keeps the AI dashboard fully offline. Set to `false` and add `OPENAI_API_KEY` to call OpenAI for real.

4. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open <http://localhost:3000>.

## What's where

- `app/` &mdash; routes. The main app lives under `app/(app)/`.
- `app/(app)/submit/` &mdash; submission form (Phase 3).
- `app/(app)/submissions/` &mdash; list + detail (Phase 4).
- `app/(app)/dashboard/` &mdash; AI dashboard (Phases 5&ndash;7).
- `app/api/analyze/` &mdash; AI analysis endpoint.
- `components/` &mdash; UI: `app/` (shell), `auth/`, `submission/`, `dashboard/`, `ui/` (shadcn).
- `lib/supabase/` &mdash; typed client + server helpers.
- `lib/ai/` &mdash; prompt, fixtures, analyze function.
- `lib/constants/` &mdash; seeded teams, components, gap types, frequency/impact.
- `supabase/migrations/` &mdash; SQL schema and policies.

## AI modes

The dashboard has two modes, switched at the server level by env var:

- **Fixture mode (default)** &mdash; deterministic groupings + recommendations derived directly from the current submissions. No API key required. Use this for design reviews and screen recordings.
- **Live mode** &mdash; calls OpenAI with a structured JSON schema. Enable by setting `USE_AI_FIXTURES=false` and `OPENAI_API_KEY=...` in `.env.local`. Falls back to fixtures automatically if the live call fails.

Analysis runs are triggered manually from the dashboard's "Re-run analysis" button. Each run is cached in `analysis_runs`, so the dashboard renders the latest result instantly on page load.

## Limitations of the prototype

- Submissions cannot be edited or deleted in the UI. Designers are instructed to submit a follow-up if they make a mistake.
- Drafts are not saved &mdash; an unsaved-changes warning protects against accidental navigation away from the form.
- Anyone with a valid magic link from an allowed domain can see all submissions and the dashboard. A DS-only gate is documented as a future enhancement.
- Screenshots are resized client-side to a 1600px long edge before upload to keep storage and LLM context costs bounded.
