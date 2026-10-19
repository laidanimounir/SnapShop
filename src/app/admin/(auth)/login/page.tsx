"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInAdmin } from "@/app/admin/actions";
import { BRAND_NAME } from "@/lib/config";
import { ar } from "@/lib/admin/i18n-ar";

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
    <div className="min-h-screen flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white border border-black/10 rounded-xl p-6 space-y-4"
      >
        <div>
          <h1 className="text-lg font-semibold">{BRAND_NAME} — لوحة الإدارة</h1>
          <p className="text-sm text-black/60">{ar.login.subtitle}</p>
        </div>

        {deniedByLayout && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm">
            {ar.messages.notAdmin}
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-black mb-1">
            {ar.login.email}
          </label>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-black/10 rounded-lg outline-none focus:border-black/30"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-black mb-1">
            {ar.login.password}
          </label>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-black/10 rounded-lg outline-none focus:border-black/30"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 rounded-full bg-black text-white text-sm font-medium hover:bg-black/80 transition-all disabled:opacity-50"
        >
          {isSubmitting ? ar.login.signingIn : ar.login.signIn}
        </button>
      </form>
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
