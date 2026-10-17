import type { SizeType } from "../../types/product.types";
import { CLOTHING_SIZES, SHOE_SIZES } from "../sizes";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
// Hard limit: 1 primary + up to 3 secondary images per product.
// Kept in sync with MAX_PRODUCT_IMAGES in ./images.
export const MAX_IMAGES_PER_PRODUCT = 4;
export const MAX_COLORS_PER_PRODUCT = 20;
export const MAX_SIZES_PER_PRODUCT = 40;
export const MAX_VARIANT_STOCK = 100000;

const SIZE_TYPES: SizeType[] = ["none", "clothing", "shoes", "custom"];

export type ProductInput = {
  name: string;
  description: string;
  category?: string | null;
  brand?: string | null;
  base_price: number;
  discount_percentage?: number;
  discount_amount?: number;
  is_active?: boolean;
  size_type?: SizeType;
};

export type ValidProduct = {
  name: string;
  description: string;
  category: string | null;
  brand: string | null;
  base_price: number;
  discount_percentage: number;
  discount_amount: number;
  is_active: boolean;
  size_type: SizeType;
};

function fail(message: string): { ok: false; error: string } {
  return { ok: false, error: message };
}

export function validateProductInput(
  input: ProductInput
): { ok: true; value: ValidProduct } | { ok: false; error: string } {
  const name = (input.name ?? "").trim();
  if (name.length < 1 || name.length > 200) {
    return fail("Product name must be 1-200 characters.");
  }
  const description = (input.description ?? "").trim();
  if (description.length > 5000) {
    return fail("Description must be at most 5000 characters.");
  }
  const category = (input.category ?? "").trim() || null;
  if (category && category.length > 120) {
    return fail("Category must be at most 120 characters.");
  }
  const brand = (input.brand ?? "").trim() || null;
  if (brand && brand.length > 120) {
    return fail("Brand must be at most 120 characters.");
  }
  const basePrice = Number(input.base_price);
  if (!Number.isFinite(basePrice) || basePrice < 0) {
    return fail("Base price must be a number >= 0.");
  }
  const pct = Number(input.discount_percentage ?? 0);
  if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
    return fail("Discount percentage must be between 0 and 100.");
  }
  const amt = Number(input.discount_amount ?? 0);
  if (!Number.isFinite(amt) || amt < 0) {
    return fail("Discount amount must be a number >= 0.");
  }
  if (pct > 0 && amt > 0) {
    return fail("Only one discount type is allowed (percentage or fixed amount).");
  }
  if (amt > basePrice) {
    return fail("Discount amount cannot exceed the base price.");
  }
  const sizeType = input.size_type ?? "none";
  if (!SIZE_TYPES.includes(sizeType)) {
    return fail("Invalid size type.");
  }
  return {
    ok: true,
    value: {
      name,
      description,
      category,
      brand,
      base_price: Math.round(basePrice * 100) / 100,
      discount_percentage: pct,
      discount_amount: Math.round(amt * 100) / 100,
      is_active: input.is_active ?? false,
      size_type: sizeType,
    },
  };
}

export type ColorInput = { name: string; hex: string };

export function validateColor(
  color: ColorInput
): { ok: true; value: ColorInput } | { ok: false; error: string } {
  const name = (color.name ?? "").trim();
  if (name.length < 1 || name.length > 60) {
    return fail("Color name must be 1-60 characters.");
  }
  if (!/^#[0-9a-fA-F]{6}$/.test((color.hex ?? "").trim())) {
    return fail(`Color "${name}" needs a hex value like #RRGGBB.`);
  }
  return { ok: true, value: { name, hex: color.hex.trim().toUpperCase() } };
}

export function validateSizeValue(
  size: string,
  sizeType: SizeType
): { ok: true; value: string } | { ok: false; error: string } {
  const value = (size ?? "").trim();
  if (value.length < 1 || value.length > 20) {
    return fail("Each size must be 1-20 characters.");
  }
  if (sizeType === "clothing" && !CLOTHING_SIZES.includes(value)) {
    return fail(`"${value}" is not a clothing size (XS-XXL).`);
  }
  if (sizeType === "shoes" && !SHOE_SIZES.includes(value)) {
    return fail(`"${value}" is not a shoe size (35-47).`);
  }
  return { ok: true, value };
}

export type VariantRowInput = {
  stock_quantity: number;
  price?: number | null;
  sku?: string | null;
};

export function validateVariantRow(
  row: VariantRowInput
): { ok: true } | { ok: false; error: string } {
  const stock = Number(row.stock_quantity);
  if (!Number.isInteger(stock) || stock < 0 || stock > MAX_VARIANT_STOCK) {
    return fail(`Stock must be an integer 0-${MAX_VARIANT_STOCK}.`);
  }
  if (row.price != null) {
    const price = Number(row.price);
    if (!Number.isFinite(price) || price < 0) {
      return fail("Price override must be a number >= 0.");
    }
  }
  if (row.sku != null && String(row.sku).length > 64) {
    return fail("SKU must be at most 64 characters.");
  }
  return { ok: true };
}

export type ImageKind = "jpg" | "png" | "webp";

/**
 * Detect the real image type from magic bytes (never trust MIME/extension).
 * Returns null for anything that is not jpeg/png/webp.
 */
export function detectImageType(bytes: Uint8Array): ImageKind | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpg";
  }
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && // R
    bytes[1] === 0x49 && // I
    bytes[2] === 0x46 && // F
    bytes[3] === 0x46 && // F
    bytes[8] === 0x57 && // W
    bytes[9] === 0x45 && // E
    bytes[10] === 0x42 && // B
    bytes[11] === 0x50 // P
  ) {
    return "webp";
  }
  return null;
}

/** Extract the in-bucket path from a product-images public URL. */
export function storagePathFromPublicUrl(url: string): string | null {
  const marker = "product-images/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const path = url.slice(idx + marker.length).split("?")[0];
  if (!path || path.includes("..")) return null;
  return path;
}
