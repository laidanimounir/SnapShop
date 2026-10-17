import { describe, expect, it } from "vitest";
import {
  MAX_DELIVERY_PRICE,
  isValidWilayaCode,
  parseDeliveryPrice,
  validateDeliveryPrice,
} from "../delivery-validation";

describe("parseDeliveryPrice", () => {
  it("accepts integers and up to 2 decimals", () => {
    expect(parseDeliveryPrice("600")).toBe(600);
    expect(parseDeliveryPrice("600.5")).toBe(600.5);
    expect(parseDeliveryPrice("600.50")).toBe(600.5);
    expect(parseDeliveryPrice(400)).toBe(400);
  });

  it("rejects invalid formats", () => {
    expect(parseDeliveryPrice("")).toBeNull();
    expect(parseDeliveryPrice("abc")).toBeNull();
    expect(parseDeliveryPrice("-5")).toBeNull();
    expect(parseDeliveryPrice("1.234")).toBeNull();
    expect(parseDeliveryPrice("1,5")).toBeNull();
    expect(parseDeliveryPrice(Number.NaN)).toBeNull();
    expect(parseDeliveryPrice(null)).toBeNull();
  });

  it("enforces the bounds", () => {
    expect(parseDeliveryPrice(String(MAX_DELIVERY_PRICE))).toBe(MAX_DELIVERY_PRICE);
    expect(parseDeliveryPrice(String(MAX_DELIVERY_PRICE + 1))).toBeNull();
  });
});

describe("validateDeliveryPrice", () => {
  it("returns null for valid values", () => {
    expect(validateDeliveryPrice("0")).toBeNull();
    expect(validateDeliveryPrice("600.00")).toBeNull();
  });

  it("returns a message otherwise", () => {
    expect(validateDeliveryPrice("")).toMatch(/سعر/);
    expect(validateDeliveryPrice("100001")).toMatch(/سعر/);
  });
});

describe("isValidWilayaCode", () => {
  it("accepts 1..58 only", () => {
    expect(isValidWilayaCode(1)).toBe(true);
    expect(isValidWilayaCode(58)).toBe(true);
    expect(isValidWilayaCode("16")).toBe(true);
    expect(isValidWilayaCode(0)).toBe(false);
    expect(isValidWilayaCode(59)).toBe(false);
    expect(isValidWilayaCode(1.5)).toBe(false);
    expect(isValidWilayaCode(undefined)).toBe(false);
  });
});
