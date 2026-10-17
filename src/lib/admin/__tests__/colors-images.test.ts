import { describe, expect, it } from "vitest";
import { COMMON_COLORS, isValidHex, normalizeHex } from "../colors";
import {
  MAX_PRODUCT_IMAGES,
  canAddImages,
  capImages,
  hasTooManyImages,
  imagesForDisplay,
  moveImage,
  sortImages,
} from "../images";

describe("COMMON_COLORS", () => {
  it("has ~24 unique colors with Arabic and English names", () => {
    expect(COMMON_COLORS.length).toBeGreaterThanOrEqual(20);
    expect(COMMON_COLORS.length).toBeLessThanOrEqual(30);
    const names = COMMON_COLORS.map((c) => c.en);
    expect(new Set(names).size).toBe(names.length);
    for (const c of COMMON_COLORS) {
      expect(c.en.length).toBeGreaterThan(0);
      expect(c.ar.length).toBeGreaterThan(0);
      expect(isValidHex(c.hex)).toBe(true);
    }
  });
});

describe("isValidHex / normalizeHex", () => {
  it("accepts #RRGGBB with or without #", () => {
    expect(isValidHex("#ff0000")).toBe(true);
    expect(isValidHex("FF0000")).toBe(true);
    expect(isValidHex("#FFF")).toBe(false);
    expect(isValidHex("red")).toBe(false);
    expect(isValidHex("#GGGGGG")).toBe(false);
  });

  it("normalizes to uppercase #RRGGBB", () => {
    expect(normalizeHex("ff0000")).toBe("#FF0000");
    expect(normalizeHex("#00ff00")).toBe("#00FF00");
    expect(normalizeHex("nope")).toBe(null);
  });
});

describe("image ordering helpers", () => {
  const img = (id: string, position: number, is_primary = false) => ({
    id,
    position,
    is_primary,
  });

  it("sorts by position and caps at the max", () => {
    const images = [
      img("d", 3),
      img("a", 0, true),
      img("b", 1),
      img("c", 2),
      img("e", 4),
    ];
    expect(sortImages(images).map((i) => i.id)).toEqual([
      "a",
      "b",
      "c",
      "d",
      "e",
    ]);
    const capped = capImages(images);
    expect(capped).toHaveLength(MAX_PRODUCT_IMAGES);
    expect(capped.map((i) => i.id)).toEqual(["a", "b", "c", "d"]);
    expect(images).toHaveLength(5); // input not mutated
  });

  it("imagesForDisplay never returns more than 4", () => {
    const many = Array.from({ length: 7 }, (_, i) => img(`x${i}`, i));
    expect(imagesForDisplay(many)).toHaveLength(MAX_PRODUCT_IMAGES);
  });

  it("moveImage reorders, recomputes positions and sets primary at index 0", () => {
    const images = [
      img("a", 0, true),
      img("b", 1),
      img("c", 2),
      img("d", 3),
    ];
    const moved = moveImage(images, 2, 0); // c to front
    expect(moved.map((i) => i.id)).toEqual(["c", "a", "b", "d"]);
    expect(moved.map((i) => i.position)).toEqual([0, 1, 2, 3]);
    expect(moved[0].is_primary).toBe(true);
    expect(moved.slice(1).every((i) => i.is_primary === false)).toBe(true);
  });

  it("moveImage clamps out-of-range targets", () => {
    const images = [img("a", 0, true), img("b", 1)];
    expect(moveImage(images, 1, 99).map((i) => i.id)).toEqual(["a", "b"]);
    expect(moveImage(images, 5, 0).map((i) => i.id)).toEqual(["a", "b"]);
  });
});

describe("image count guards", () => {
  it("flags legacy products with more than 4 images", () => {
    expect(hasTooManyImages(4)).toBe(false);
    expect(hasTooManyImages(5)).toBe(true);
  });

  it("blocks uploads once the limit is reached", () => {
    expect(canAddImages(3)).toBe(true);
    expect(canAddImages(4)).toBe(false);
    expect(canAddImages(3, 2)).toBe(false);
  });
});
