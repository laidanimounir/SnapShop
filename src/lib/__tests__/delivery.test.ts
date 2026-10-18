import { describe, expect, it } from "vitest";
import {
  formatZoneLabel,
  getDeliveryPrice,
  getOrderTotal,
  isDeliveryType,
  type DeliveryZone,
} from "../delivery";

const zone: DeliveryZone = {
  wilaya_code: 16,
  name_ar: "الجزائر",
  name_fr: "Alger",
  home_price: 600,
  office_price: 400,
};

describe("delivery helpers", () => {
  it("returns 0 when no zone is selected", () => {
    expect(getDeliveryPrice(null, "home")).toBe(0);
    expect(getDeliveryPrice(null, "office")).toBe(0);
  });

  it("picks home vs office price", () => {
    expect(getDeliveryPrice(zone, "home")).toBe(600);
    expect(getDeliveryPrice(zone, "office")).toBe(400);
  });

  it("rounds to 2 decimals", () => {
    expect(
      getDeliveryPrice({ ...zone, home_price: 600.005 }, "home")
    ).toBe(600.01);
  });

  it("computes total = subtotal - discount + delivery", () => {
    expect(getOrderTotal(749.98, 0, 600)).toBe(1349.98);
    expect(getOrderTotal(1000, 100, 400)).toBe(1300);
  });

  it("rounds totals to 2 decimals", () => {
    expect(getOrderTotal(0.1, 0, 0.2)).toBe(0.3);
  });

  it("formats a zone label with the code and Arabic name only", () => {
    expect(formatZoneLabel(zone)).toBe("16 — الجزائر");
    expect(formatZoneLabel({ ...zone, wilaya_code: 1 })).toBe("01 — الجزائر");
  });

  it("narrows delivery types", () => {
    expect(isDeliveryType("home")).toBe(true);
    expect(isDeliveryType("office")).toBe(true);
    expect(isDeliveryType("drone")).toBe(false);
  });
});
