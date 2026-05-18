import Link from "next/link";
import { AppFooter } from "@/components/app/app-footer";
import { PrototypeBadge } from "@/components/app/prototype-badge";
import { SetupNotice } from "@/components/app/setup-notice";
import { LoginForm } from "@/components/auth/login-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = {
  title: "Sign in | DS Gap Insights",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  return (
    <>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-16">
        <div className="space-y-2 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight"
          >
            <span>DS Gap Insights</span>
            <PrototypeBadge />
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            We&apos;ll email you a magic link &mdash; no password needed.
          </p>
        </div>
        {isSupabaseConfigured() ? (
          <LoginFormWrapper searchParams={searchParams} />
        ) : (
          <SetupNotice />
        )}
      </main>
      <AppFooter />
    </>
  );
}

async function LoginFormWrapper({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  return <LoginForm next={params.next ?? "/"} />;
}
