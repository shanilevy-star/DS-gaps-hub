# Setup — DS Gap Hub + your Supabase project

Project dashboard: [xxrouryrsamjihukcagu](https://supabase.com/dashboard/project/xxrouryrsamjihukcagu)

Follow these steps once. Total time: ~10 minutes.

## 1. Add your API key to `.env.local`

Open [Project Settings → API](https://supabase.com/dashboard/project/xxrouryrsamjihukcagu/settings/api) and copy the **anon public** key.

Paste it into [`.env.local`](.env.local):

```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

The URL is already set to `https://xxrouryrsamjihukcagu.supabase.co`.

Verify:

```bash
npm run verify:setup
```

## 2. Run database SQL (one paste)

Open the [SQL Editor](https://supabase.com/dashboard/project/xxrouryrsamjihukcagu/sql/new) and run the full contents of:

**[`supabase/setup-all.sql`](supabase/setup-all.sql)**

This creates tables, RLS policies, and the `submission-images` storage bucket. It does not create demo submissions.

## 3. Configure Auth URLs

Open [Authentication → URL Configuration](https://supabase.com/dashboard/project/xxrouryrsamjihukcagu/auth/url-configuration):

| Field | Value |
|--------|--------|
| **Site URL** | `http://localhost:3000` |
| **Redirect URLs** | `http://localhost:3000/auth/callback`, `http://localhost:3000/reset-password` |

Ensure **Email** provider is enabled under [Auth Providers](https://supabase.com/dashboard/project/xxrouryrsamjihukcagu/auth/providers).

When deploying, also add your production reset URL, e.g. `https://YOUR_DOMAIN/reset-password`.

## 4. Start the app

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

1. Go to **Sign in** and enter your work email.
2. Open the magic link from your inbox.
3. Visit **Dashboard** → click **Run analysis** to generate AI insights.
4. Visit **Submit a gap** to add a real submission.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| “Supabase isn’t configured” on every page | Add `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local` and restart `npm run dev`. |
| Magic link doesn’t sign you in | Add redirect URL `http://localhost:3000/auth/callback` in Auth URL config. |
| “Could not save submission” | Run `supabase/setup-all.sql` in the SQL editor. |
| Image upload fails | Confirm bucket `submission-images` exists (created by setup SQL). |
| Dashboard AI empty | Click **Run analysis** after you have submissions (or after seed). |

## Optional: live OpenAI analysis

In `.env.local`:

```env
USE_AI_FIXTURES=false
OPENAI_API_KEY=sk-...
```

Fixture mode remains the default and is enough for demos.
