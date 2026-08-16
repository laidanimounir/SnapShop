export function getEffectivePrice(
  basePrice: number,
  variantPrice: number | null
): number {
  return variantPrice ?? basePrice;
}

export function getDiscountedPrice(
  price: number,
  discountPercentage: number,
  discountAmount: number
): number {
  if (discountPercentage > 0) {
    return Math.round(price - (price * discountPercentage) / 100);
  }
  if (discountAmount > 0) {
    return Math.round(price - discountAmount);
  }
  return Math.round(price);
}

export function getDiscountAmount(
  price: number,
  discountPercentage: number,
  discountAmount: number
): number {
  if (discountPercentage > 0) {
    return Math.round((price * discountPercentage) / 100);
  }
  if (discountAmount > 0) {
    return Math.round(discountAmount);
  }
  return 0;
}

export const formatPrice = (value: number) => `DA ${Math.round(value)}`;
