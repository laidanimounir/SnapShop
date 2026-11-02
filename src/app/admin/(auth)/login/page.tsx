"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LockKeyhole } from "lucide-react";

import { signInAdmin } from "@/app/admin/actions";
import { ar } from "@/lib/admin/i18n-ar";
import { Button } from "@/components/admin/ui/button";
import { Card } from "@/components/admin/ui/card";
import { Input } from "@/components/admin/ui/input";
import { Label } from "@/components/admin/ui/label";
import { AdminLogo } from "@/components/admin/layout/admin-logo";

function LoginPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Set by the dashboard layout when a signed-in non-admin hits /admin/*.
  const deniedByLayout = searchParams.get("reason") === "no-access";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError(ar.login.empty);
      return;
    }
    setIsSubmitting(true);
    try {
      // Server action: signs in with the cookie-based Supabase server
      // client (session persists server-side), verifies admin_users
      // membership and signs non-admins back out.
      const result = await signInAdmin(email, password);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError(ar.login.genericError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-svh items-center justify-center bg-admin-muted/40 px-4 py-10">
      <Card className="w-full max-w-md gap-0 p-6 shadow-lg">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <AdminLogo className="text-admin-foreground" />
          <div className="space-y-1">
            <h1 className="text-lg font-semibold tracking-tight">
              {ar.login.title}
            </h1>
            <p className="text-xs text-admin-muted-foreground">
              {ar.login.subtitle}
            </p>
          </div>
        </div>

        {deniedByLayout && (
          <div
            role="status"
            className="mb-4 flex items-start gap-2 rounded-md border border-admin-border bg-admin-muted px-3 py-2 text-xs text-admin-foreground"
          >
            <LockKeyhole className="mt-0.5 size-4 shrink-0" />
            <span>{ar.messages.notAdmin}</span>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-md border border-admin-destructive/30 bg-admin-destructive/10 px-3 py-2 text-xs text-admin-destructive"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="admin-email">{ar.login.email}</Label>
            <Input
              id="admin-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(error)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="admin-password">{ar.login.password}</Label>
            <Input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(error)}
            />
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? ar.login.signingIn : ar.login.signIn}
          </Button>
        </form>
      </Card>
    </div>
  );
}

// useSearchParams requires a Suspense boundary during prerendering.
export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPanel />
    </Suspense>
  );
}
