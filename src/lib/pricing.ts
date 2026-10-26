// 2-decimal truth everywhere: matches the server-side
// round(..., 2) in place_guest_order. Display uses the same
// rounding via formatPrice so client and server never disagree.

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function getEffectivePrice(
  basePrice: number,
  variantPrice: number | null
): number {
  return round2(variantPrice ?? basePrice);
}

export function getDiscountedPrice(
  price: number,
  discountPercentage: number,
  discountAmount: number
): number {
  if (discountPercentage > 0) {
    return round2(price - (price * discountPercentage) / 100);
  }
  if (discountAmount > 0) {
    return round2(price - discountAmount);
  }
  return round2(price);
}

export function getDiscountAmount(
  price: number,
  discountPercentage: number,
  discountAmount: number
): number {
  if (discountPercentage > 0) {
    return round2((price * discountPercentage) / 100);
  }
  if (discountAmount > 0) {
    return round2(discountAmount);
  }
  return 0;
}

export const formatPrice = (value: number) => `DA ${round2(value).toFixed(2)}`;

/**
 * Old ("was") price to show struck through next to the real price.
 * Returns null when there is no old price or when it is not higher than
 * the price the customer pays — display only, never used for charging.
 */
export function getCompareAtPrice(
  compareAtPrice: number | null | undefined,
  price: number
): number | null {
  if (compareAtPrice == null || !Number.isFinite(compareAtPrice)) return null;
  if (compareAtPrice <= price) return null;
  return round2(compareAtPrice);
}

/**
 * Savings badge derived for display only (no math relationship is stored):
 * how much is off and in which percent of the old price.
 */
export function getSavings(
  compareAtPrice: number,
  price: number
): { amount: number; percent: number } {
  const amount = round2(compareAtPrice - price);
  const percent =
    compareAtPrice > 0
      ? Math.max(0, Math.round((amount / compareAtPrice) * 100))
      : 0;
  return { amount, percent };
}
