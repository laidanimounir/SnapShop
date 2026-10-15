import { describe, expect, it } from "vitest";
import {
  MAX_QUANTITY_PER_VARIANT,
  clampQuantity,
} from "../features/carts/cartsSlice";

describe("cart quantity clamping (mirrors server cap 1-10)", () => {
  it("caps at the server maximum", () => {
    expect(MAX_QUANTITY_PER_VARIANT).toBe(10);
    expect(clampQuantity(11)).toBe(10);
    expect(clampQuantity(100)).toBe(10);
  });

  it("floors at 1 and drops fractions", () => {
    expect(clampQuantity(0)).toBe(1);
    expect(clampQuantity(-3)).toBe(1);
    expect(clampQuantity(2.9)).toBe(2);
  });

  it("passes valid quantities through", () => {
    expect(clampQuantity(1)).toBe(1);
    expect(clampQuantity(5)).toBe(5);
    expect(clampQuantity(10)).toBe(10);
  });
});
