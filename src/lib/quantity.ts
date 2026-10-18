// Mirrors the server cap in migration 0004 (quantity 1-10 per variant).
export const MAX_QUANTITY_PER_VARIANT = 10;

export function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(
    MAX_QUANTITY_PER_VARIANT,
    Math.max(1, Math.floor(quantity))
  );
}

/** True when the quantity is within the server-accepted range for one variant. */
export function isValidQuantity(quantity: number): boolean {
  return (
    Number.isInteger(quantity) &&
    quantity >= 1 &&
    quantity <= MAX_QUANTITY_PER_VARIANT
  );
}
