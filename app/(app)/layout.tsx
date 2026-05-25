import { AppNav } from "@/components/app/app-nav";
import { UserMenu } from "@/components/app/user-menu";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getCurrentEmail(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    return data.user?.email ?? null;
  } catch {
    return null;
  }
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const email = await getCurrentEmail();
  return (
    <>
      <AppNav rightSlot={<UserMenu email={email} />} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
    </>
  );
}
