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
