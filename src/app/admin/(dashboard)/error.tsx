"use client";

import { AlertTriangle } from "lucide-react";
import * as React from "react";

import { ar } from "@/lib/admin/i18n-ar";
import { Button } from "@/components/admin/ui/button";
import { Card } from "@/components/admin/ui/card";
import { cn } from "@/lib/utils";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Log the full error for debugging in development
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    console.groupCollapsed("⚠️ Admin Error Boundary caught:");
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
    if (error.digest) console.error("Digest:", error.digest);
    console.groupEnd();
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <Card className={cn("w-full max-w-sm items-center gap-4 p-6 text-center")}>
        <span className="flex size-10 items-center justify-center rounded-full bg-admin-muted text-admin-muted-foreground">
          <AlertTriangle className="size-5" />
        </span>
        <p className="text-sm text-admin-muted-foreground">
          {ar.messages.pageError}
        </p>
        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 text-xs text-admin-muted-foreground text-left">
            <details className="cursor-pointer">
              <summary>{ar.messages.tryAgain}</summary>
              <pre className="mt-2 overflow-x-auto text-admin-foreground">
                {error.message}
              </pre>
            </details>
          </div>
        )}
        <Button type="button" onClick={reset} className="mt-3">
          {ar.messages.tryAgain}
        </Button>
      </Card>
    </div>
  );
}
