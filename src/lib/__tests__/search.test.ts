import { describe, expect, it } from "vitest";
import { MAX_SEARCH_LENGTH, sanitizeSearchTerm } from "../search";

describe("sanitizeSearchTerm", () => {
  it("strips PostgREST .or() separators and LIKE wildcards", () => {
    expect(sanitizeSearchTerm(`a,b(c)d"e'f\\g%h_i`)).toBe("abcdefghi");
  });

  it("trims and caps length", () => {
    expect(sanitizeSearchTerm("  shirt  ")).toBe("shirt");
    expect(sanitizeSearchTerm("x".repeat(100))).toHaveLength(
      MAX_SEARCH_LENGTH
    );
  });

  it("returns empty for empty or fully-stripped input", () => {
    expect(sanitizeSearchTerm("")).toBe("");
    expect(sanitizeSearchTerm("%%__,,")).toBe("");
  });
});
