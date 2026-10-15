import { describe, expect, it } from "vitest";
import {
  CLOTHING_SIZES,
  SHOE_SIZES,
  formatVariantLabel,
  presetSizesFor,
  sortSizes,
} from "../sizes";

describe("sizes presets", () => {
  it("clothing preset is XS-XXL in order", () => {
    expect(presetSizesFor("clothing")).toEqual([
      "XS",
      "S",
      "M",
      "L",
      "XL",
      "XXL",
    ]);
    expect(CLOTHING_SIZES).toHaveLength(6);
  });

  it("shoe preset is 35-47 whole sizes", () => {
    expect(SHOE_SIZES[0]).toBe("35");
    expect(SHOE_SIZES[SHOE_SIZES.length - 1]).toBe("47");
    expect(SHOE_SIZES).toHaveLength(13);
    expect(SHOE_SIZES.every((s) => /^[0-9]+$/.test(s))).toBe(true);
  });

  it("none/custom presets are empty", () => {
    expect(presetSizesFor("none")).toEqual([]);
    expect(presetSizesFor("custom")).toEqual([]);
  });
});

describe("sortSizes", () => {
  it("sorts clothing sizes XS-XXL", () => {
    expect(sortSizes(["XL", "S", "M", "XS", "XXL", "L"], "clothing")).toEqual([
      "XS",
      "S",
      "M",
      "L",
      "XL",
      "XXL",
    ]);
  });

  it("pushes unknown clothing sizes last", () => {
    expect(sortSizes(["M", "OneSize", "S"], "clothing")).toEqual([
      "S",
      "M",
      "OneSize",
    ]);
  });

  it("sorts shoe sizes numerically", () => {
    expect(sortSizes(["44", "40", "42"], "shoes")).toEqual(["40", "42", "44"]);
  });

  it("keeps custom sizes in entry order and dedupes", () => {
    expect(sortSizes(["B", "A", "B", "C"], "custom")).toEqual(["B", "A", "C"]);
  });

  it("keeps none type in entry order", () => {
    expect(sortSizes(["M", "S"], "none")).toEqual(["M", "S"]);
  });
});

describe("formatVariantLabel", () => {
  it("joins color and size", () => {
    expect(formatVariantLabel("Red", "M")).toBe("Red / M");
  });

  it("handles missing parts without undefined", () => {
    expect(formatVariantLabel("Red", null)).toBe("Red");
    expect(formatVariantLabel(null, "M")).toBe("M");
    expect(formatVariantLabel(null, null)).toBe("One size");
    expect(formatVariantLabel("", "")).toBe("One size");
  });
});
