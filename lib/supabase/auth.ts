import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "./config";

export async function getCurrentUser() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function requireUser(redirectTo: string) {
  const user = await getCurrentUser();
  if (!user) {
    const next = encodeURIComponent(redirectTo);
    redirect(`/login?next=${next}`);
  }
  return user;
}
