import Link from "next/link";
import { SetupNotice } from "@/components/app/setup-notice";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = {
  title: "Reset password | DS Gap Hub",
};

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div className="space-y-2 text-center">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight"
        >
          DS Gap Hub
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Reset password
        </h1>
        <p className="text-sm text-muted-foreground">
          Choose a new password for your account.
        </p>
      </div>
      {isSupabaseConfigured() ? <ResetPasswordForm /> : <SetupNotice />}
    </main>
  );
}
