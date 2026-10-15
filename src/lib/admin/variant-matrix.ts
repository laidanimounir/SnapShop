import type { ColorInput } from "./product-validation";

export type VariantSpec = {
  color: string | null;
  color_hex: string | null;
  size: string | null;
};

export type ExistingVariant = {
  id: string;
  color: string | null;
  size: string | null;
};

export type MatrixDiff = {
  /** Combinations that do not exist yet. */
  toCreate: VariantSpec[];
  /** Existing variants safe to delete (never ordered). */
  toRemove: ExistingVariant[];
  /** Existing variants that were ordered: deactivate, never delete. */
  toDeactivate: ExistingVariant[];
};

function keyOf(color: string | null, size: string | null): string {
  return `${color ?? ""}\n${size ?? ""}`;
}

/**
 * Build the variant matrix from the product's colors and sizes:
 * - no colors + no sizes => exactly 1 variant (null/null)
 * - colors only / sizes only / both => the cross product
 */
export function buildVariantMatrix(
  colors: ColorInput[],
  sizes: string[]
): VariantSpec[] {
  const hasColors = colors.length > 0;
  const hasSizes = sizes.length > 0;
  if (!hasColors && !hasSizes) {
    return [{ color: null, color_hex: null, size: null }];
  }
  if (hasColors && !hasSizes) {
    return colors.map((c) => ({ color: c.name, color_hex: c.hex, size: null }));
  }
  if (!hasColors && hasSizes) {
    return sizes.map((s) => ({ color: null, color_hex: null, size: s }));
  }
  const out: VariantSpec[] = [];
  for (const c of colors) {
    for (const s of sizes) {
      out.push({ color: c.name, color_hex: c.hex, size: s });
    }
  }
  return out;
}

/**
 * Diff existing variants against the desired matrix.
 * `orderedVariantIds` = variant ids referenced by any order_items row.
 */
export function diffVariantMatrix(
  existing: ExistingVariant[],
  desired: VariantSpec[],
  orderedVariantIds: Set<string>
): MatrixDiff {
  const wanted = new Set(desired.map((d) => keyOf(d.color, d.size)));
  const seen = new Set(existing.map((e) => keyOf(e.color, e.size)));

  const toCreate = desired.filter((d) => !seen.has(keyOf(d.color, d.size)));
  const toRemove: ExistingVariant[] = [];
  const toDeactivate: ExistingVariant[] = [];

  for (const e of existing) {
    if (wanted.has(keyOf(e.color, e.size))) continue;
    if (orderedVariantIds.has(e.id)) toDeactivate.push(e);
    else toRemove.push(e);
  }

  return { toCreate, toRemove, toDeactivate };
}
