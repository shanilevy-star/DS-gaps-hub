"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  | { kind: "loading" }
  | { kind: "reset-sending" }
  | { kind: "reset-sent" }
  | { kind: "error"; message: string };

type AuthMode = "sign-in" | "sign-up";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const isLoading = status.kind === "loading" || status.kind === "reset-sending";
  const isSignIn = mode === "sign-in";

  function validateEmail(value: string): string | null {
    if (!value) return "Enter your work email first.";

    if (!isEmailAllowed(value)) {
      return ALLOWED_EMAIL_DOMAINS.length === 1
        ? `Only @${ALLOWED_EMAIL_DOMAINS[0]} emails can sign in.`
        : `Only ${ALLOWED_EMAIL_DOMAINS.map((d) => `@${d}`).join(", ")} emails can sign in.`;
    }

    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !password) return;

    const emailError = validateEmail(trimmed);
    if (emailError) {
      setStatus({ kind: "error", message: emailError });
      return;
    }

    setStatus({ kind: "loading" });
    try {
      const supabase = createClient();
      const { error } =
        mode === "sign-in"
          ? await supabase.auth.signInWithPassword({
              email: trimmed,
              password,
            })
          : await supabase.auth.signUp({
              email: trimmed,
              password,
            });

      if (error) {
        setStatus({ kind: "error", message: error.message });
        return;
      }

      router.push(next || "/");
      router.refresh();
    } catch (err) {
      setStatus({
        kind: "error",
        message:
          err instanceof Error ? err.message : "Something went wrong. Try again.",
      });
    }
  }

  async function handleForgotPassword() {
    const trimmed = email.trim();
    const emailError = validateEmail(trimmed);
    if (emailError) {
      setStatus({ kind: "error", message: emailError });
      return;
    }

    setStatus({ kind: "reset-sending" });
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setStatus({ kind: "error", message: error.message });
        return;
      }

      setStatus({ kind: "reset-sent" });
    } catch (err) {
      setStatus({
        kind: "error",
        message:
          err instanceof Error ? err.message : "Something went wrong. Try again.",
      });
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight"
        >
          DS Gap Hub
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isSignIn ? "Sign in" : "Sign up"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isSignIn
            ? "Sign in with your work email and password."
            : "Sign up with your work email and password."}
        </p>
      </div>

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
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            autoComplete={isSignIn ? "current-password" : "new-password"}
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isLoading}
          />
        </div>
        {status.kind === "error" ? (
          <p className="text-sm text-destructive">{status.message}</p>
        ) : null}
        {status.kind === "reset-sent" ? (
          <p className="text-sm text-muted-foreground">
            Password reset link sent. Check your email.
          </p>
        ) : null}
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading
            ? status.kind === "reset-sending"
              ? "Sending reset link..."
              : isSignIn
              ? "Signing in..."
              : "Creating account..."
            : isSignIn
              ? "Sign in"
              : "Sign up"}
        </Button>
        {isSignIn ? (
          <button
            type="button"
            className="block w-full text-center text-xs font-medium text-foreground underline-offset-4 hover:underline disabled:opacity-50"
            onClick={handleForgotPassword}
            disabled={isLoading}
          >
            Forgot password?
          </button>
        ) : null}
        <p className="text-center text-xs text-muted-foreground">
          {isSignIn
            ? "Don’t have an account yet?"
            : "Already have an account?"}{" "}
          <button
            type="button"
            className="font-medium text-foreground underline-offset-4 hover:underline"
            onClick={() => {
              setMode((current) =>
                current === "sign-in" ? "sign-up" : "sign-in",
              );
              setStatus({ kind: "idle" });
            }}
            disabled={isLoading}
          >
            {isSignIn ? "Sign up" : "Sign in"}
          </button>
        </p>
      </form>
    </div>
  );
}
