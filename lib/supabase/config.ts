// Centralized check for whether Supabase is configured.
// We do this rather than crashing on missing env vars so the prototype
// can render a friendly setup screen instead of a 500.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const ALLOWED_EMAIL_DOMAINS = (
  process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS ?? ""
)
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function isEmailAllowed(email: string): boolean {
  if (ALLOWED_EMAIL_DOMAINS.length === 0) return true;
  const lower = email.toLowerCase();
  return ALLOWED_EMAIL_DOMAINS.some((d) => lower.endsWith(`@${d}`));
}
