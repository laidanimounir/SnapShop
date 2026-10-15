import { describe, expect, it } from "vitest";
import {
  detectImageType,
  storagePathFromPublicUrl,
  validateColor,
  validateProductInput,
  validateSizeValue,
  validateVariantRow,
} from "../product-validation";
import { buildVariantMatrix, diffVariantMatrix } from "../variant-matrix";

describe("validateProductInput", () => {
  const base = {
    name: "Tee",
    description: "Nice",
    base_price: 25,
  };

  it("accepts a minimal valid product", () => {
    const r = validateProductInput(base);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.is_active).toBe(false);
      expect(r.value.size_type).toBe("none");
    }
  });

  it("rejects two discounts at once", () => {
    const r = validateProductInput({
      ...base,
      discount_percentage: 10,
      discount_amount: 5,
    });
    expect(r.ok).toBe(false);
  });

  it("rejects discount above 100% and amount above price", () => {
    expect(validateProductInput({ ...base, discount_percentage: 101 }).ok).toBe(false);
    expect(validateProductInput({ ...base, discount_amount: 30 }).ok).toBe(false);
  });

  it("rejects negative price and empty name", () => {
    expect(validateProductInput({ ...base, base_price: -1 }).ok).toBe(false);
    expect(validateProductInput({ ...base, name: "  " }).ok).toBe(false);
  });
});

describe("validateColor / validateSizeValue / validateVariantRow", () => {
  it("accepts #RRGGBB and rejects bad hex", () => {
    expect(validateColor({ name: "Red", hex: "#ff0000" }).ok).toBe(true);
    expect(validateColor({ name: "Red", hex: "red" }).ok).toBe(false);
    expect(validateColor({ name: "Red", hex: "#FFF" }).ok).toBe(false);
  });

  it("validates sizes against presets", () => {
    expect(validateSizeValue("M", "clothing").ok).toBe(true);
    expect(validateSizeValue("40", "clothing").ok).toBe(false);
    expect(validateSizeValue("42", "shoes").ok).toBe(true);
    expect(validateSizeValue("M", "shoes").ok).toBe(false);
    expect(validateSizeValue("tall", "custom").ok).toBe(true);
    expect(validateSizeValue("x".repeat(21), "custom").ok).toBe(false);
  });

  it("validates stock and price override", () => {
    expect(validateVariantRow({ stock_quantity: 10 }).ok).toBe(true);
    expect(validateVariantRow({ stock_quantity: -1 }).ok).toBe(false);
    expect(validateVariantRow({ stock_quantity: 1.5 }).ok).toBe(false);
    expect(validateVariantRow({ stock_quantity: 100001 }).ok).toBe(false);
    expect(validateVariantRow({ stock_quantity: 5, price: -2 }).ok).toBe(false);
  });
});

describe("detectImageType", () => {
  it("detects jpeg/png/webp by magic bytes", () => {
    expect(detectImageType(new Uint8Array([0xff, 0xd8, 0xff, 0x00]))).toBe("jpg");
    expect(detectImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBe("png");
    const webp = new Uint8Array(12);
    webp.set([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
    expect(detectImageType(webp)).toBe("webp");
  });

  it("rejects a .txt renamed to .jpg", () => {
    const text = new TextEncoder().encode("hello, I am not an image");
    expect(detectImageType(text)).toBe(null);
  });
});

describe("storagePathFromPublicUrl", () => {
  it("extracts the in-bucket path", () => {
    expect(
      storagePathFromPublicUrl(
        "https://x.supabase.co/storage/v1/object/public/product-images/products/p/f.png"
      )
    ).toBe("products/p/f.png");
  });

  it("rejects foreign urls and traversal", () => {
    expect(storagePathFromPublicUrl("https://evil.com/a.png")).toBe(null);
    expect(
      storagePathFromPublicUrl("https://x.supabase.co/storage/v1/object/public/product-images/../a.png")
    ).toBe(null);
  });
});

describe("buildVariantMatrix", () => {
  it("no colors + no sizes => single variant", () => {
    expect(buildVariantMatrix([], [])).toEqual([
      { color: null, color_hex: null, size: null },
    ]);
  });

  it("colors only, sizes only, and cross product", () => {
    const colors = [
      { name: "Red", hex: "#FF0000" },
      { name: "Blue", hex: "#0000FF" },
    ];
    expect(buildVariantMatrix(colors, [])).toHaveLength(2);
    expect(
      buildVariantMatrix([], ["S", "M"]).map((v) => v.size)
    ).toEqual(["S", "M"]);
    expect(buildVariantMatrix(colors, ["S", "M", "L"])).toHaveLength(6);
  });
});

describe("diffVariantMatrix", () => {
  it("creates missing, deletes un-ordered, deactivates ordered", () => {
    const existing = [
      { id: "a", color: "Red", size: "S" },
      { id: "b", color: "Red", size: "M" },
      { id: "c", color: "Blue", size: "S" },
    ];
    const desired = [
      { color: "Red", color_hex: "#FF0000", size: "S" },
      { color: "Red", color_hex: "#FF0000", size: "L" },
    ];
    const diff = diffVariantMatrix(existing, desired, new Set(["b"]));
    expect(diff.toCreate).toEqual([
      { color: "Red", color_hex: "#FF0000", size: "L" },
    ]);
    expect(diff.toRemove.map((v) => v.id)).toEqual(["c"]);
    expect(diff.toDeactivate.map((v) => v.id)).toEqual(["b"]);
  });
});
