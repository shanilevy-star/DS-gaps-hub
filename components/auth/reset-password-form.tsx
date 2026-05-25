"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

type Status =
  | { kind: "checking" }
  | { kind: "ready" }
  | { kind: "loading" }
  | { kind: "invalid" }
  | { kind: "error"; message: string };

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "checking" });

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();

      if (!mounted) return;
      setStatus(data.session ? { kind: "ready" } : { kind: "invalid" });
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!password || !confirmPassword) {
      setStatus({ kind: "error", message: "Enter and confirm your new password." });
      return;
    }

    if (password.length < 8) {
      setStatus({
        kind: "error",
        message: "Password must be at least 8 characters.",
      });
      return;
    }

    if (password !== confirmPassword) {
      setStatus({ kind: "error", message: "Passwords do not match." });
      return;
    }

    setStatus({ kind: "loading" });
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setStatus({ kind: "error", message: error.message });
        return;
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setStatus({
        kind: "error",
        message:
          err instanceof Error ? err.message : "Something went wrong. Try again.",
      });
    }
  }

  if (status.kind === "checking") {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        Checking reset link...
      </div>
    );
  }

  if (status.kind === "invalid") {
    return (
      <div className="space-y-4 rounded-lg border border-border bg-card p-6 text-sm">
        <p className="text-muted-foreground">
          This reset link is invalid or expired. Request a new password reset
          link.
        </p>
        <Button asChild className="w-full">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  const isLoading = status.kind === "loading";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-border bg-card p-6"
    >
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Enter a new password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Confirm your new password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          disabled={isLoading}
        />
      </div>
      {status.kind === "error" ? (
        <p className="text-sm text-destructive">{status.message}</p>
      ) : null}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Saving password..." : "Reset password"}
      </Button>
    </form>
  );
}
