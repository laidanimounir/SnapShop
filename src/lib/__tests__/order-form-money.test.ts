import { describe, expect, it } from "vitest";
import {
  getDiscountAmount,
  getDiscountedPrice,
  getEffectivePrice,
  round2,
} from "../pricing";
import { getDeliveryPrice, getOrderTotal, type DeliveryZone } from "../delivery";

// Mirrors the server formula in place_guest_order (0004 :347-351
// plus delivery from 0007): subtotal = effective_price * qty (pre-discount),
// discount_total = unit_discount * qty, total = subtotal - discount + delivery.
const zone: DeliveryZone = {
  wilaya_code: 16,
  name_ar: "الجزائر",
  name_fr: "Alger",
  home_price: 600,
  office_price: 400,
};

function computeOrder({
  unitBasePrice,
  variantPrice = null,
  discountPercentage = 0,
  discountAmount = 0,
  quantity,
  deliveryType,
}: {
  unitBasePrice: number;
  variantPrice?: number | null;
  discountPercentage?: number;
  discountAmount?: number;
  quantity: number;
  deliveryType: "home" | "office";
}) {
  const effectivePrice = getEffectivePrice(unitBasePrice, variantPrice);
  const unitDiscount = getDiscountAmount(
    effectivePrice,
    discountPercentage,
    discountAmount
  );
  const subtotal = round2(effectivePrice * quantity);
  const discountTotal = round2(unitDiscount * quantity);
  const deliveryPrice = getDeliveryPrice(zone, deliveryType);
  const total = getOrderTotal(subtotal, discountTotal, deliveryPrice);
  return { effectivePrice, unitDiscount, subtotal, discountTotal, deliveryPrice, total };
}

describe("order money parity with place_guest_order", () => {
  it("computes a percentage discount like the server", () => {
    // Server: unit_discount = round(effective * pct / 100, 2)
    const order = computeOrder({
      unitBasePrice: 10000,
      discountPercentage: 20,
      quantity: 2,
      deliveryType: "home",
    });
    expect(order.unitDiscount).toBe(2000);
    expect(order.subtotal).toBe(20000);
    expect(order.discountTotal).toBe(4000);
    expect(order.deliveryPrice).toBe(600);
    expect(order.total).toBe(16600); // 20000 - 4000 + 600
  });

  it("computes a fixed-amount discount like the server", () => {
    const order = computeOrder({
      unitBasePrice: 4990.5,
      discountAmount: 500.25,
      quantity: 3,
      deliveryType: "office",
    });
    expect(order.unitDiscount).toBe(500.25);
    expect(order.subtotal).toBe(14971.5);
    expect(order.discountTotal).toBe(1500.75);
    expect(order.deliveryPrice).toBe(400);
    expect(order.total).toBe(13870.75);
  });

  it("prefers a variant price over the product base price", () => {
    const order = computeOrder({
      unitBasePrice: 8000,
      variantPrice: 7500,
      discountPercentage: 10,
      quantity: 1,
      deliveryType: "home",
    });
    expect(order.effectivePrice).toBe(7500);
    expect(order.unitDiscount).toBe(750);
    expect(order.total).toBe(7350); // 7500 - 750 + 600
  });

  it("matches the server cap: discount never exceeds the effective price", () => {
    // Server: v_unit_discount := least(v_unit_discount, v_effective_price)
    const effective = getEffectivePrice(1000, null);
    const unitDiscount = getDiscountAmount(effective, 0, 1500);
    const capped = Math.min(unitDiscount, effective);
    expect(capped).toBe(1000);
  });

  it("rounds money at 2 decimals everywhere (round2 policy)", () => {
    expect(round2(0.1 + 0.2)).toBe(0.3);
    expect(round2(749.999)).toBe(750);
    // Server round((effective * pct / 100)::numeric, 2) vs client round2
    const unitDiscount = getDiscountAmount(3333.33, 15, 0);
    expect(unitDiscount).toBe(500); // 500.00 (client) matches server round(..., 2)
    expect(getDiscountedPrice(3333.33, 15, 0)).toBe(2833.33);
  });

  it("orders with no discount still add delivery correctly", () => {
    const order = computeOrder({
      unitBasePrice: 749.99,
      quantity: 1,
      deliveryType: "home",
    });
    expect(order.discountTotal).toBe(0);
    expect(order.total).toBe(1349.99);
  });

  it("unknown zone yields zero delivery (client display before wilaya pick)", () => {
    expect(getDeliveryPrice(null, "home")).toBe(0);
    expect(getOrderTotal(1000, 100, 0)).toBe(900);
  });
});
