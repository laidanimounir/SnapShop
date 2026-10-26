import { describe, expect, it } from "vitest";
import { validateQuantityOffers } from "@/lib/admin/quantity-offers";
import type { QuantityOfferDraft } from "@/types/offer.types";

const draft = (
  overrides: Partial<QuantityOfferDraft> = {}
): QuantityOfferDraft => ({
  id: null,
  quantity: "",
  total_price: "",
  label: "",
  badge: "",
  is_default: false,
  is_active: true,
  ...overrides,
});

describe("validateQuantityOffers", () => {
  it("accepts an empty list (no offers)", () => {
    const result = validateQuantityOffers([], 400);
    expect(result).toEqual({ ok: true, offers: [] });
  });

  it("ignores blank rows", () => {
    const result = validateQuantityOffers(
      [draft({ quantity: "2", total_price: "700" }), draft()],
      400
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.offers).toHaveLength(1);
  });

  it("keeps at most 3 offers", () => {
    const result = validateQuantityOffers(
      [
        draft({ quantity: "1", total_price: "380" }),
        draft({ quantity: "2", total_price: "700" }),
        draft({ quantity: "3", total_price: "1000" }),
        draft({ quantity: "4", total_price: "1300" }),
      ],
      400
    );
    expect(result.ok).toBe(false);
  });

  it("rejects quantities outside 1..10 or non-integers", () => {
    expect(
      validateQuantityOffers([draft({ quantity: "0", total_price: "100" })], 400)
        .ok
    ).toBe(false);
    expect(
      validateQuantityOffers([draft({ quantity: "11", total_price: "100" })], 400)
        .ok
    ).toBe(false);
    expect(
      validateQuantityOffers([draft({ quantity: "1.5", total_price: "100" })], 400)
        .ok
    ).toBe(false);
  });

  it("rejects duplicate quantities", () => {
    const result = validateQuantityOffers(
      [
        draft({ quantity: "2", total_price: "700" }),
        draft({ quantity: "2", total_price: "690" }),
      ],
      400
    );
    expect(result.ok).toBe(false);
  });

  it("rejects a total price that is not above zero", () => {
    expect(
      validateQuantityOffers(
        [draft({ quantity: "2", total_price: "0" })],
        400
      ).ok
    ).toBe(false);
    expect(
      validateQuantityOffers(
        [draft({ quantity: "2", total_price: "abc" })],
        400
      ).ok
    ).toBe(false);
  });

  it("rejects a total above quantity x base price", () => {
    // 2 x 400 = 800 is the limit
    expect(
      validateQuantityOffers(
        [draft({ quantity: "2", total_price: "800.01" })],
        400
      ).ok
    ).toBe(false);
    expect(
      validateQuantityOffers(
        [draft({ quantity: "2", total_price: "800" })],
        400
      ).ok
    ).toBe(true);
  });

  it("rounds the total and normalises defaults (exactly one)", () => {
    const result = validateQuantityOffers(
      [
        draft({ quantity: "1", total_price: "399.999", is_default: false }),
        draft({ quantity: "2", total_price: "750", is_default: true }),
        draft({ quantity: "3", total_price: "1100", is_default: true }),
      ],
      400
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.offers.map((o) => o.total_price)).toEqual([
        400, 750, 1100,
      ]);
      expect(result.offers.filter((o) => o.is_default)).toHaveLength(1);
      expect(result.offers[1].is_default).toBe(true);
    }
  });

  it("picks the first offer as default when none is chosen", () => {
    const result = validateQuantityOffers(
      [
        draft({ quantity: "2", total_price: "700" }),
        draft({ quantity: "3", total_price: "1000" }),
      ],
      400
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.offers[0].is_default).toBe(true);
      expect(result.offers[1].is_default).toBe(false);
    }
  });

  it("trims badge and label, empty becomes null", () => {
    const result = validateQuantityOffers(
      [
        draft({
          quantity: "2",
          total_price: "700",
          badge: "  الأكثر طلبًا  ",
          label: "   ",
        }),
      ],
      400
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.offers[0].badge).toBe("الأكثر طلبًا");
      expect(result.offers[0].label).toBeNull();
    }
  });
});
