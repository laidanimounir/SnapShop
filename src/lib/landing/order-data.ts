import type { SizeType } from "@/lib/sizes";
import type { DeliveryZone } from "@/lib/delivery";

/** One active variant, reduced to what the landing order form needs. */
export type LandingVariant = {
  id: string;
  color: string | null;
  colorHex: string | null;
  size: string | null;
  /** Variant price override; null means "use the product base price". */
  price: number | null;
  stock: number;
};

/** Everything the public landing page order form needs, pre-shaped. */
export type LandingOrderData = {
  productId: string;
  name: string;
  basePrice: number;
  discountPercentage: number;
  discountAmount: number;
  sizeType: SizeType;
  variants: LandingVariant[];
  zones: DeliveryZone[];
};

export type RawLandingProduct = {
  id?: unknown;
  name?: unknown;
  base_price?: unknown;
  discount_percentage?: unknown;
  discount_amount?: unknown;
  size_type?: unknown;
};

export type RawLandingVariant = {
  id?: unknown;
  color?: unknown;
  color_hex?: unknown;
  size?: unknown;
  price?: unknown;
  stock_quantity?: unknown;
  is_active?: unknown;
};

export type RawDeliveryZone = {
  wilaya_code?: unknown;
  name_ar?: unknown;
  name_fr?: unknown;
  home_price?: unknown;
  office_price?: unknown;
  is_active?: unknown;
};

const SIZE_TYPES: string[] = ["none", "clothing", "shoes", "custom"];

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function asNonNegativeNumber(value: unknown): number | null {
  // null/undefined/"" mean "absent", not zero (Number(null) === 0).
  if (value == null || value === "") return null;
  if (typeof value !== "number" && typeof value !== "string") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function asStock(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.floor(n);
}

/**
 * Turns raw product / variant / delivery-zone rows into the compact
 * structure the landing order form consumes. Never throws: junk values
 * are dropped or normalised. Returns null when the product row itself
 * is unusable (missing id/name/base price), so the page can render the
 * rest of the sections without an order form.
 */
export function shapeLandingOrderData(
  product: RawLandingProduct | null | undefined,
  variants: RawLandingVariant[] | null | undefined,
  zones: RawDeliveryZone[] | null | undefined
): LandingOrderData | null {
  const productId = asTrimmedString(product?.id);
  const name = asTrimmedString(product?.name);
  const basePrice = asNonNegativeNumber(product?.base_price);
  if (!productId || !name || basePrice === null) return null;

  const discountPercentage = Math.min(
    100,
    asNonNegativeNumber(product?.discount_percentage) ?? 0
  );
  const discountAmount = asNonNegativeNumber(product?.discount_amount) ?? 0;

  const rawSizeType = asTrimmedString(product?.size_type);
  const sizeType: SizeType =
    rawSizeType && SIZE_TYPES.includes(rawSizeType)
      ? (rawSizeType as SizeType)
      : "none";

  const shapedVariants: LandingVariant[] = [];
  const seenVariantIds = new Set<string>();
  for (const row of variants ?? []) {
    if (row?.is_active === false) continue;
    const id = asTrimmedString(row?.id);
    if (!id || seenVariantIds.has(id)) continue;
    seenVariantIds.add(id);
    shapedVariants.push({
      id,
      color: asTrimmedString(row?.color),
      colorHex: asTrimmedString(row?.color_hex),
      size: asTrimmedString(row?.size),
      price: asNonNegativeNumber(row?.price),
      stock: asStock(row?.stock_quantity),
    });
  }

  const shapedZones: DeliveryZone[] = [];
  const seenCodes = new Set<number>();
  for (const row of zones ?? []) {
    if (row?.is_active === false) continue;
    const code = asNonNegativeNumber(row?.wilaya_code);
    const nameAr = asTrimmedString(row?.name_ar);
    const home = asNonNegativeNumber(row?.home_price);
    const office = asNonNegativeNumber(row?.office_price);
    if (code === null || !Number.isInteger(code) || code < 1) continue;
    if (!nameAr || home === null || office === null) continue;
    if (seenCodes.has(code)) continue;
    seenCodes.add(code);
    shapedZones.push({
      wilaya_code: code,
      name_ar: nameAr,
      name_fr: asTrimmedString(row?.name_fr) ?? "",
      home_price: home,
      office_price: office,
    });
  }
  shapedZones.sort((a, b) => a.wilaya_code - b.wilaya_code);

  return {
    productId,
    name,
    basePrice,
    discountPercentage,
    discountAmount,
    sizeType,
    variants: shapedVariants,
    zones: shapedZones,
  };
}
