// Pure validation for delivery-zone admin edits. Shared by the client
// editor and the server actions so both enforce the same limits.

import { ar } from "./i18n-ar";

export const MIN_DELIVERY_PRICE = 0;
export const MAX_DELIVERY_PRICE = 100000;

/** Parse "600", "600.5", "600.50" or a number; null when invalid. */
export function parseDeliveryPrice(value: unknown): number | null {
  let n: number;
  if (typeof value === "number") {
    n = value;
  } else if (typeof value === "string") {
    const trimmed = value.trim();
    if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
    n = Number(trimmed);
  } else {
    return null;
  }

  if (!Number.isFinite(n)) return null;
  if (n < MIN_DELIVERY_PRICE || n > MAX_DELIVERY_PRICE) return null;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Human-readable validation error, or null when the price is valid. */
export function validateDeliveryPrice(value: unknown): string | null {
  const n = parseDeliveryPrice(value);
  if (n === null) {
    return ar.validation.deliveryPrice;
  }
  return null;
}

export function isValidWilayaCode(value: unknown): boolean {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 58;
}
