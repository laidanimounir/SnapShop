// Conversion events for the landing page. The page itself only ever gets
// the base pixel code; this module queues the funnel events (view a
// product, start the order form, complete the order) so shopper actions
// reach both Meta and TikTok.

type Fbq = (
  action: string,
  event: string,
  params?: Record<string, unknown>
) => void;

type Ttq = {
  track?: (event: string, params?: Record<string, unknown>) => void;
};

type PixelWindow = {
  fbq?: Fbq;
  ttq?: Ttq;
};

export type TrackValue = {
  /** Order total when known; helps cost-per-purchase reporting. */
  value?: number;
  currency?: string;
  /** Number of items the buyer took. */
  quantity?: number;
};

function read(value: number | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function paramsOf(value: TrackValue | undefined): Record<string, unknown> {
  const params: Record<string, unknown> = { currency: value?.currency ?? "DZD" };
  const value_ = read(value?.value);
  if (value_ !== undefined) params.value = value_;
  const quantity = read(value?.quantity);
  if (quantity !== undefined) params.quantity = quantity;
  return params;
}

/**
 * Fires the same funnel event on whichever pixels the page loaded.
 * Safe on the server and when no pixel id was configured.
 */
export function trackPixelEvent(
  event: "ViewContent" | "InitiateCheckout" | "Purchase",
  value?: TrackValue
): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as PixelWindow;
  const params = paramsOf(value);
  try {
    w.fbq?.("track", event, params);
    w.ttq?.track?.(event, params);
  } catch {
    // Tracking must never break the order flow.
  }
}
