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
  /** Selected quantity tier (offers feature): its id, never a price. */
  offerId?: string | null;
  /** Quantity of the selected tier (mirrors `quantity` when a tier is on). */
  offerQuantity?: number;
  /** Product ids the event is about (Meta/TikTok content_ids). */
  contentIds?: string[];
  /** Usually "product" for this store. */
  contentType?: string;
  /** Dedup key for server/pixel conversions (Meta event_id). */
  eventId?: string;
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
  // Offer params are only meaningful together (and only when a tier exists).
  if (value?.offerId) {
    params.offer_id = value.offerId;
    const offerQuantity = read(value.offerQuantity);
    if (offerQuantity !== undefined) params.offer_quantity = offerQuantity;
  }
  if (Array.isArray(value?.contentIds) && value.contentIds.length > 0) {
    params.content_ids = value.contentIds;
  }
  if (value?.contentType) params.content_type = value.contentType;
  if (value?.eventId) params.event_id = value.eventId;
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
