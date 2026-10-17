"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "@/app/admin/actions";
import {
  STATUS_LABELS,
  allowedTransitions,
  transitionRestoresStock,
  type OrderStatus,
} from "@/lib/admin/order-transitions";
import { cn } from "@/lib/utils";

export default function OrderStatusActions({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<OrderStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const options = allowedTransitions(status);

  const run = async (next: OrderStatus) => {
    let note: string | undefined;
    if (next === "cancelled" || next === "returned") {
      const reason = window.prompt(
        `Reason for marking this order ${next}? (optional)`
      );
      if (reason === null) return;
      note = reason.trim() || undefined;
    }

    const restores = transitionRestoresStock(status, next);
    if (
      !window.confirm(
        `Change status to ${STATUS_LABELS[next]}?${
          restores ? "\n\nStock will be restored." : ""
        }`
      )
    ) {
      return;
    }

    setBusy(next);
    setError(null);
    setMessage(null);
    const result = await updateOrderStatus(orderId, next, note);
    setBusy(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage(
      restores
        ? `Status updated to ${STATUS_LABELS[next]}. Stock was restored.`
        : `Status updated to ${STATUS_LABELS[next]}.`
    );
    router.refresh();
  };

  if (options.length === 0) {
    return (
      <p className="text-sm text-black/50">
        This order is in a terminal state — no further transitions.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const danger = option === "cancelled" || option === "returned";
          return (
            <button
              key={option}
              type="button"
              onClick={() => run(option)}
              disabled={busy !== null}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50",
                danger
                  ? "border border-red-200 text-red-700 hover:bg-red-50"
                  : "bg-black text-white hover:bg-black/80"
              )}
            >
              {busy === option
                ? "Saving…"
                : `Mark ${STATUS_LABELS[option]}`}
            </button>
          );
        })}
      </div>
      {message && (
        <p className="text-sm text-emerald-700">{message}</p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-xs text-black/50">
        Transitions are validated on the server; stock is restored only on
        cancel/return from a stock-holding state.
      </p>
    </div>
  );
}
