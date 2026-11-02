"use client";

import { AlertTriangle } from "lucide-react";

import { ar } from "@/lib/admin/i18n-ar";
import { Button } from "@/components/admin/ui/button";
import { Card } from "@/components/admin/ui/card";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <Card className="w-full max-w-sm items-center gap-4 p-6 text-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-admin-muted text-admin-muted-foreground">
          <AlertTriangle className="size-5" />
        </span>
        <p className="text-sm text-admin-muted-foreground">
          {ar.messages.pageError}
        </p>
        <Button type="button" onClick={reset}>
          {ar.messages.tryAgain}
        </Button>
      </Card>
    </div>
  );
}
