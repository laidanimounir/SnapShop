import { describe, expect, it } from "vitest";
import {
  hasAnyFieldError,
  validateAddress,
  validateCheckoutFields,
  validateName,
  validatePhone,
  validateWilaya,
} from "../checkout/validation";

describe("checkout field validators", () => {
  it("requires a non-empty name", () => {
    expect(validateName("")).toBeTruthy();
    expect(validateName("   ")).toBeTruthy();
    expect(validateName("أمين")).toBeUndefined();
  });

  it("requires an Algerian 05/06 phone of exactly 10 digits", () => {
    expect(validatePhone("")).toBeTruthy();
    expect(validatePhone("0550")).toBeTruthy();
    expect(validatePhone("05501234")).toBeTruthy();
    expect(validatePhone("0750123456")).toBeTruthy();
    expect(validatePhone("05501234567")).toBeTruthy();
    expect(validatePhone("0550123456")).toBeUndefined();
    expect(validatePhone("0650123456")).toBeUndefined();
    expect(validatePhone("+213 550 12 34 56")).toBeUndefined();
    expect(validatePhone("00213550123456")).toBeUndefined();
  });

  it("requires a non-empty address", () => {
    expect(validateAddress("")).toBeTruthy();
    expect(validateAddress("حي النصر، الجزائر")).toBeUndefined();
  });

  it("requires a wilaya only when zones exist", () => {
    expect(validateWilaya("", true)).toBeTruthy();
    expect(validateWilaya("16", true)).toBeUndefined();
    expect(validateWilaya("", false)).toBeUndefined();
  });
});

describe("validateCheckoutFields / hasAnyFieldError", () => {
  it("reports every invalid field at once", () => {
    const errors = validateCheckoutFields({
      customerName: "",
      phone: "123",
      address: "",
      wilayaCode: "",
      hasZones: true,
    });
    expect(errors.customerName).toBeTruthy();
    expect(errors.phone).toBeTruthy();
    expect(errors.address).toBeTruthy();
    expect(errors.wilaya).toBeTruthy();
    expect(hasAnyFieldError(errors)).toBe(true);
  });

  it("returns all-clear for a fully valid form", () => {
    const errors = validateCheckoutFields({
      customerName: "أمين",
      phone: "0550123456",
      address: "حي النصر",
      wilayaCode: "16",
      hasZones: true,
    });
    expect(hasAnyFieldError(errors)).toBe(false);
  });

  it("allows an empty wilaya when no zones are loaded", () => {
    const errors = validateCheckoutFields({
      customerName: "أمين",
      phone: "0550123456",
      address: "حي النصر",
      wilayaCode: "",
      hasZones: false,
    });
    expect(hasAnyFieldError(errors)).toBe(false);
  });
});
