import { describe, expect, it } from "vitest";
import {
  maskSecret,
  validateHttpsUrl,
  validatePixelId,
} from "../settings-validation";

describe("validatePixelId", () => {
  it("accepts empty and 5-20 digits", () => {
    expect(validatePixelId("")).toBeNull();
    expect(validatePixelId("12345")).toBeNull();
    expect(validatePixelId("12345678901234567890")).toBeNull();
  });

  it("rejects wrong lengths and non-digits", () => {
    expect(validatePixelId("1234")).toMatch(/معرّف البكسل/);
    expect(validatePixelId("123456789012345678901")).toMatch(/معرّف البكسل/);
    expect(validatePixelId("12a45")).toMatch(/معرّف البكسل/);
    expect(validatePixelId("12 345")).toMatch(/معرّف البكسل/);
  });
});

describe("validateHttpsUrl", () => {
  it("accepts empty and https URLs", () => {
    expect(validateHttpsUrl("")).toBeNull();
    expect(validateHttpsUrl("https://api.example.com/v1")).toBeNull();
  });

  it("rejects http and malformed URLs", () => {
    expect(validateHttpsUrl("http://api.example.com")).toMatch(/https/);
    expect(validateHttpsUrl("not a url")).toMatch(/URL/);
    expect(validateHttpsUrl("ftp://example.com")).toMatch(/https/);
  });
});

describe("maskSecret", () => {
  it("shows only the last 4 characters", () => {
    expect(maskSecret("TEST-E2E-KEY-1234")).toBe("••••••1234");
    expect(maskSecret("abcd")).toBe("••••••abcd");
    expect(maskSecret("abcdefgh")).toBe("••••••efgh");
  });

  it("does not leak short or empty values", () => {
    expect(maskSecret("ab")).toBe("••••••ab");
    expect(maskSecret("")).toBe("Not set");
    expect(maskSecret(null)).toBe("Not set");
    expect(maskSecret(undefined)).toBe("Not set");
  });

  it("never contains the full secret", () => {
    const secret = "TEST-E2E-KEY-1234";
    expect(maskSecret(secret)).not.toContain(secret);
  });
});

