export type SizeType = "none" | "clothing" | "shoes" | "custom";

export const CLOTHING_SIZES: string[] = ["XS", "S", "M", "L", "XL", "XXL"];

// Shoe sizes 35-47, whole sizes only (no half sizes).
export const SHOE_SIZES: string[] = Array.from(
  { length: 47 - 35 + 1 },
  (_, i) => String(35 + i)
);

export const MAX_CUSTOM_SIZE_LENGTH = 20;

export function presetSizesFor(sizeType: SizeType): string[] {
  if (sizeType === "clothing") return [...CLOTHING_SIZES];
  if (sizeType === "shoes") return [...SHOE_SIZES];
  return [];
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values));
}

/**
 * Sort sizes sensibly for the product's size_type:
 * - clothing: XS < S < M < L < XL < XXL (unknown values last, input order)
 * - shoes: numeric ascending (non-numeric values last, input order)
 * - none/custom: kept in the order entered
 */
export function sortSizes(
  sizes: string[],
  sizeType: SizeType | null | undefined
): string[] {
  const unique = dedupe(sizes);
  if (sizeType === "clothing") {
    const rank = new Map(CLOTHING_SIZES.map((s, i) => [s, i]));
    return unique.sort((a, b) => {
      const ra = rank.get(a) ?? Number.MAX_SAFE_INTEGER;
      const rb = rank.get(b) ?? Number.MAX_SAFE_INTEGER;
      return ra - rb;
    });
  }
  if (sizeType === "shoes") {
    const num = (s: string) => (/^[0-9]+$/.test(s) ? parseInt(s, 10) : null);
    return unique.sort((a, b) => {
      const na = num(a);
      const nb = num(b);
      if (na != null && nb != null) return na - nb;
      if (na != null) return -1;
      if (nb != null) return 1;
      return 0;
    });
  }
  return unique;
}

/** "Red / M", "Red", "M", or "One size" when both are missing. */
export function formatVariantLabel(
  color: string | null | undefined,
  size: string | null | undefined
): string {
  const parts = [color, size].filter(
    (p): p is string => p != null && p !== ""
  );
  return parts.length > 0 ? parts.join(" / ") : "One size";
}
