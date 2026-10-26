import { describe, expect, it } from "vitest";

import { isValidDzPhone, normalizeDzPhone } from "../checkout/phone";

describe("normalizeDzPhone", () => {
  it("accepts the plain 10-digit 05/06 form", () => {
    expect(normalizeDzPhone("0550123456")).toBe("0550123456");
    expect(normalizeDzPhone("0650123456")).toBe("0650123456");
  });

  it("strips spaces, dashes, dots and parentheses", () => {
    expect(normalizeDzPhone("05 50 12 34 56")).toBe("0550123456");
    expect(normalizeDzPhone("05-50-12-34-56")).toBe("0550123456");
    expect(normalizeDzPhone("05.50.12.34.56")).toBe("0550123456");
    expect(normalizeDzPhone("(05) 50 12 34 56")).toBe("0550123456");
  });

  it("normalizes +213 and 00213 country forms to 0XXXXXXXXX", () => {
    expect(normalizeDzPhone("+213550123456")).toBe("0550123456");
    expect(normalizeDzPhone("+213 550 12 34 56")).toBe("0550123456");
    expect(normalizeDzPhone("00213550123456")).toBe("0550123456");
    expect(normalizeDzPhone("213550123456")).toBe("0550123456");
    // Country prefix with a local 0 written after it.
    expect(normalizeDzPhone("+213 0550123456")).toBe("0550123456");
  });

  it("rejects wrong lengths and non-05/06 prefixes", () => {
    expect(normalizeDzPhone("")).toBeNull();
    expect(normalizeDzPhone("0550")).toBeNull();
    expect(normalizeDzPhone("05501234")).toBeNull();
    expect(normalizeDzPhone("0750123456")).toBeNull();
    expect(normalizeDzPhone("05501234567")).toBeNull();
    expect(normalizeDzPhone("2135501234")).toBeNull();
  });

  it("rejects letters and non-string input", () => {
    expect(normalizeDzPhone("0550abc456")).toBeNull();
    expect(normalizeDzPhone(null)).toBeNull();
    expect(normalizeDzPhone(undefined)).toBeNull();
    expect(normalizeDzPhone(550123456)).toBeNull();
  });
});

describe("isValidDzPhone", () => {
  it("mirrors normalizeDzPhone", () => {
    expect(isValidDzPhone("+213 550 12 34 56")).toBe(true);
    expect(isValidDzPhone("0550")).toBe(false);
    expect(isValidDzPhone("")).toBe(false);
  });
});
