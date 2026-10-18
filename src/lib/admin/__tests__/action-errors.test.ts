import { describe, expect, it } from "vitest";
import { normalizeActionError } from "../action-errors";
import { ar } from "../i18n-ar";

describe("normalizeActionError", () => {
  it("keeps the message of a real Error", () => {
    expect(normalizeActionError(new Error("boom"))).toBe("boom");
  });

  it("ignores an Error with an empty message and falls back to generic", () => {
    expect(normalizeActionError(new Error("   "))).toBe(ar.messages.generic);
  });

  it("maps PostgREST SQLSTATE codes to specific Arabic messages", () => {
    const cases: Array<[string, string]> = [
      ["23502", ar.messages.dbNotNull],
      ["23505", ar.messages.dbUnique],
      ["23503", ar.messages.dbForeignKey],
      ["23514", ar.messages.dbCheck],
      ["42501", ar.messages.dbPermission],
    ];
    for (const [code, expected] of cases) {
      expect(
        normalizeActionError({
          message: `null value in column "name_ar" violates not-null constraint`,
          details: "Failing row contains (...)",
          hint: null,
          code,
        })
      ).toBe(expected);
    }
    // A known code still maps even without a message.
    expect(normalizeActionError({ code: "23502" })).toBe(ar.messages.dbNotNull);
  });

  it("joins message/details/hint for unmapped PostgREST codes", () => {
    expect(
      normalizeActionError({
        message: "something failed",
        details: "some detail",
        hint: "try this",
        code: "PGRST999",
      })
    ).toBe("something failed — some detail — try this");
  });

  it("returns just the message when details/hint are empty", () => {
    expect(normalizeActionError({ message: "only message", code: "PGRST100" })).toBe(
      "only message"
    );
  });

  it("falls back to generic for unknown or non-object values", () => {
    expect(normalizeActionError(null)).toBe(ar.messages.generic);
    expect(normalizeActionError(undefined)).toBe(ar.messages.generic);
    expect(normalizeActionError("nope")).toBe(ar.messages.generic);
    expect(normalizeActionError(42)).toBe(ar.messages.generic);
    expect(normalizeActionError({})).toBe(ar.messages.generic);
    expect(normalizeActionError({ code: "99999" })).toBe(ar.messages.generic);
  });
});
