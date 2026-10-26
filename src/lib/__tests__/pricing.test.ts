import { describe, expect, it } from "vitest";
import {
  formatPrice,
  getCompareAtPrice,
  getDiscountAmount,
  getDiscountedPrice,
  getEffectivePrice,
  getOfferDisplay,
  getSavings,
  round2,
} from "../pricing";

describe("round2", () => {
  it("rounds to 2 decimals (not integers)", () => {
    expect(round2(10.05)).toBe(10.05);
    expect(round2(9.999)).toBe(10);
    expect(round2(19.998)).toBe(20);
  });
});

describe("discount helpers (2-decimal truth, server parity)", () => {
  it("percentage discount matches Postgres round(..., 2)", () => {
    // server: round((99.99 * 20 / 100)::numeric, 2) = 20.00
    expect(getDiscountAmount(99.99, 20, 0)).toBe(20);
    expect(getDiscountedPrice(99.99, 20, 0)).toBe(79.99);
  });

  it("fixed-amount discount keeps decimals", () => {
    expect(getDiscountAmount(99.99, 0, 10.5)).toBe(10.5);
    expect(getDiscountedPrice(99.99, 0, 10.5)).toBe(89.49);
  });

  it("no discount returns the rounded price", () => {
    expect(getDiscountedPrice(49.995, 0, 0)).toBe(50);
    expect(getDiscountAmount(49.99, 0, 0)).toBe(0);
  });

  it("effective price prefers the variant price", () => {
    expect(getEffectivePrice(100, 89.995)).toBe(90);
    expect(getEffectivePrice(100, null)).toBe(100);
  });
});

describe("formatPrice", () => {
  it("displays consistently with 2 decimals", () => {
    expect(formatPrice(89.99)).toBe("DA 89.99");
    expect(formatPrice(100)).toBe("DA 100.00");
  });
});

describe("compare_at_price (old struck price, display only)", () => {
  it("shows the old price only when it is higher than the real price", () => {
    expect(getCompareAtPrice(600, 400)).toBe(600);
    expect(getCompareAtPrice(400, 400)).toBeNull();
    expect(getCompareAtPrice(300, 400)).toBeNull();
  });

  it("treats missing/invalid values as no old price", () => {
    expect(getCompareAtPrice(null, 400)).toBeNull();
    expect(getCompareAtPrice(undefined, 400)).toBeNull();
    expect(getCompareAtPrice(Number.NaN, 400)).toBeNull();
  });

  it("derives the savings badge from the two numbers", () => {
    expect(getSavings(600, 400)).toEqual({ amount: 200, percent: 33 });
    expect(getSavings(500, 500)).toEqual({ amount: 0, percent: 0 });
    expect(getSavings(450, 400)).toEqual({ amount: 50, percent: 11 });
  });
});

describe("getOfferDisplay (quantity tiers, display only)", () => {
  it("derives reference, saving and per-piece price", () => {
    expect(getOfferDisplay(4500, 2, 2800)).toEqual({
      reference: 5600,
      saving: 1100,
      perPiece: 2250,
    });
  });

  it("shows no saving when the tier equals the normal price", () => {
    expect(getOfferDisplay(5600, 2, 2800)).toEqual({
      reference: 5600,
      saving: 0,
      perPiece: 2800,
    });
  });

  it("never reports a negative saving (merchant priced above normal)", () => {
    expect(getOfferDisplay(6000, 2, 2800).saving).toBe(0);
  });

  it("guards against a zero or invalid quantity", () => {
    expect(getOfferDisplay(4500, 0, 2800).perPiece).toBe(4500);
  });
});
