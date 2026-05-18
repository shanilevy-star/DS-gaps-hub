#!/usr/bin/env node
/**
 * Verifies .env.local and a live connection to your Supabase project.
 * Usage: npm run verify:setup
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env.local");

function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const env = loadEnvFile(envPath);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("\nDS Gap Insights — setup check\n");

if (!existsSync(envPath)) {
  console.error("✗ Missing .env.local");
  console.error("  Copy .env.example → .env.local and fill in your Supabase keys.");
  console.error("  See SETUP.md for your project: xxrouryrsamjihukcagu\n");
  process.exit(1);
}

if (!url) {
  console.error("✗ NEXT_PUBLIC_SUPABASE_URL is empty in .env.local\n");
  process.exit(1);
}

console.log(`✓ Supabase URL: ${url}`);

if (!anonKey || anonKey.length < 20) {
  console.error("\n✗ NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or too short.");
  console.error(
    "  Get it from: https://supabase.com/dashboard/project/xxrouryrsamjihukcagu/settings/api",
  );
  console.error("  Paste into .env.local, then run this script again.\n");
  process.exit(1);
}

console.log(`✓ Anon key: ${anonKey.slice(0, 12)}… (${anonKey.length} chars)`);

// Health check via REST (submissions table — may 404 before migration, 401/200 after)
const restUrl = `${url.replace(/\/$/, "")}/rest/v1/submissions?select=id&limit=1`;

try {
  const res = await fetch(restUrl, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
  });

  if (res.status === 200) {
    const rows = await res.json();
    console.log(`✓ Database reachable (${rows.length} row(s) in sample query)`);
    console.log("\nNext steps:");
    console.log("  1. If you have not run SQL yet: paste supabase/setup-all.sql in the SQL editor");
    console.log("  2. Configure auth redirect: http://localhost:3000/auth/callback");
    console.log("  3. npm run dev → http://localhost:3000\n");
    process.exit(0);
  }

  if (res.status === 404 || res.status === 406) {
    console.warn(
      "\n⚠ Connected to Supabase, but `submissions` table not found.",
    );
    console.warn(
      "  Run supabase/setup-all.sql in: https://supabase.com/dashboard/project/xxrouryrsamjihukcagu/sql/new\n",
    );
    process.exit(1);
  }

  const body = await res.text();
  console.error(`\n✗ Unexpected response ${res.status}: ${body.slice(0, 200)}\n`);
  process.exit(1);
} catch (err) {
  console.error("\n✗ Could not reach Supabase:", err.message);
  console.error("  Check your URL and network.\n");
  process.exit(1);
}
