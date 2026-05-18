"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import {
  ALLOWED_EMAIL_DOMAINS,
  isEmailAllowed,
} from "@/lib/supabase/config";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; email: string }
  | { kind: "error"; message: string };

export function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    if (!isEmailAllowed(trimmed)) {
      setStatus({
        kind: "error",
        message:
          ALLOWED_EMAIL_DOMAINS.length === 1
            ? `Only @${ALLOWED_EMAIL_DOMAINS[0]} emails can sign in.`
            : `Only ${ALLOWED_EMAIL_DOMAINS.map((d) => `@${d}`).join(", ")} emails can sign in.`,
      });
      return;
    }

    setStatus({ kind: "sending" });
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) {
        setStatus({ kind: "error", message: error.message });
        return;
      }
      setStatus({ kind: "sent", email: trimmed });
    } catch (err) {
      setStatus({
        kind: "error",
        message:
          err instanceof Error ? err.message : "Something went wrong. Try again.",
      });
    }
  }

  if (status.kind === "sent") {
    return (
      <div className="space-y-3 rounded-lg border border-border bg-card p-6 text-sm">
        <h2 className="text-base font-medium">Check your email</h2>
        <p className="text-muted-foreground">
          We sent a magic link to{" "}
          <span className="font-medium text-foreground">{status.email}</span>.
          Open it on this device to finish signing in.
        </p>
        <p className="text-xs text-muted-foreground">
          Didn&apos;t get it? Check spam, or{" "}
          <button
            type="button"
            className="underline underline-offset-4"
            onClick={() => setStatus({ kind: "idle" })}
          >
            try a different email
          </button>
          .
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-border bg-card p-6"
    >
      <div className="space-y-2">
        <Label htmlFor="email">Work email</Label>
        <Input
          id="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="you@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={status.kind === "sending"}
        />
        {ALLOWED_EMAIL_DOMAINS.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            Only{" "}
            {ALLOWED_EMAIL_DOMAINS.map((d) => `@${d}`).join(", ")} emails can
            sign in.
          </p>
        ) : null}
      </div>
      {status.kind === "error" ? (
        <p className="text-sm text-destructive">{status.message}</p>
      ) : null}
      <Button
        type="submit"
        className="w-full"
        disabled={status.kind === "sending"}
      >
        {status.kind === "sending" ? "Sending link..." : "Send magic link"}
      </Button>
    </form>
  );
}
