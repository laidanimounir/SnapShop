import { describe, expect, it } from "vitest";
import { createIdempotencyKey } from "../idempotency";

describe("createIdempotencyKey", () => {
  it("returns a non-empty string", () => {
    expect(createIdempotencyKey()).toMatch(/.+/);
  });

  it("returns a uuid when crypto.randomUUID is available", () => {
    expect(createIdempotencyKey()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });

  it("is unique per checkout attempt", () => {
    const keys = new Set(
      Array.from({ length: 100 }, () => createIdempotencyKey())
    );
    expect(keys.size).toBe(100);
  });
});
