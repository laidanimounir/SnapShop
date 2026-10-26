import { describe, expect, it } from "vitest";
import { validateProductInput } from "@/lib/admin/product-validation";

const base = {
  name: "قميص",
  description: "وصف",
  base_price: 400,
};

describe("validateProductInput - compare_at_price (old struck price)", () => {
  it("accepts an empty value and stores no old price", () => {
    const ok = validateProductInput({ ...base, compare_at_price: "" });
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.value.compare_at_price).toBeNull();
  });

  it("omits the field entirely when the caller did not send it", () => {
    const ok = validateProductInput(base);
    expect(ok.ok).toBe(true);
    if (ok.ok) expect("compare_at_price" in ok.value).toBe(false);
  });

  it("accepts an old price strictly higher than the real price", () => {
    const ok = validateProductInput({ ...base, compare_at_price: 600 });
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.value.compare_at_price).toBe(600);
  });

  it("rejects an old price equal to the real price", () => {
    const ok = validateProductInput({ ...base, compare_at_price: 400 });
    expect(ok.ok).toBe(false);
  });

  it("rejects an old price lower than the real price", () => {
    const ok = validateProductInput({ ...base, compare_at_price: 300 });
    expect(ok.ok).toBe(false);
    if (!ok.ok) expect(ok.error).toContain("السعر القديم");
  });

  it("rejects non-numeric values", () => {
    expect(
      validateProductInput({ ...base, compare_at_price: "abc" }).ok
    ).toBe(false);
    expect(
      validateProductInput({ ...base, compare_at_price: -10 }).ok
    ).toBe(false);
  });

  it("rounds the old price to 2 decimals", () => {
    const ok = validateProductInput({ ...base, compare_at_price: 600.456 });
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.value.compare_at_price).toBe(600.46);
  });
});
