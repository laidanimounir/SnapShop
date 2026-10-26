import { describe, expect, it } from "vitest";
import { isValidUuid } from "@/lib/uuid";

describe("isValidUuid", () => {
  it("accepts canonical uuids in either case", () => {
    expect(isValidUuid("0b0e8f9a-1c2d-4e5f-8a7b-6c5d4e3f2a1b")).toBe(true);
    expect(isValidUuid("0B0E8F9A-1C2D-4E5F-8A7B-6C5D4E3F2A1B")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isValidUuid("not-a-uuid")).toBe(false);
    expect(isValidUuid("")).toBe(false);
    expect(isValidUuid("../../etc/passwd")).toBe(false);
    expect(isValidUuid(null)).toBe(false);
    expect(isValidUuid(undefined)).toBe(false);
    expect(isValidUuid(123)).toBe(false);
    expect(isValidUuid("0b0e8f9a1c2d4e5f8a7b6c5d4e3f2a1b")).toBe(false);
  });
});
