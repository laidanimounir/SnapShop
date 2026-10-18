import { describe, expect, it } from "vitest";
import {
  arabicCount,
  deliveryTypeLabelAr,
  formatAr,
  formatStorePrice,
  productCountForms,
  statusLabelAr,
  type ArabicCountForms,
} from "../store/i18n-ar";

describe("formatStorePrice", () => {
  it("renders amount, space, DA with 2 decimals", () => {
    expect(formatStorePrice(12)).toBe("12.00 DA");
    expect(formatStorePrice(700)).toBe("700.00 DA");
    expect(formatStorePrice(89.99)).toBe("89.99 DA");
  });

  it("rounds to 2 decimals", () => {
    expect(formatStorePrice(0.1 + 0.2)).toBe("0.30 DA");
    expect(formatStorePrice(9.999)).toBe("10.00 DA");
    expect(formatStorePrice(10.005)).toBe("10.01 DA");
  });

  it("handles negative amounts (discount display)", () => {
    expect(formatStorePrice(-12)).toBe("-12.00 DA");
    expect(formatStorePrice(-0.5)).toBe("-0.50 DA");
    expect(`-${formatStorePrice(20)}`).toBe("-20.00 DA");
  });
});

describe("statusLabelAr", () => {
  it("maps all seven order statuses", () => {
    expect(statusLabelAr("pending")).toBe("جديد");
    expect(statusLabelAr("confirmed")).toBe("مؤكد");
    expect(statusLabelAr("no_answer")).toBe("لا يرد");
    expect(statusLabelAr("shipped")).toBe("مرسل");
    expect(statusLabelAr("delivered")).toBe("مستلم");
    expect(statusLabelAr("cancelled")).toBe("ملغى");
    expect(statusLabelAr("returned")).toBe("مرجع");
  });

  it("falls back to the code with underscores replaced", () => {
    expect(statusLabelAr("weird_status")).toBe("weird status");
  });
});

describe("deliveryTypeLabelAr", () => {
  it("maps delivery types", () => {
    expect(deliveryTypeLabelAr("home")).toBe("توصيل للمنزل");
    expect(deliveryTypeLabelAr("office")).toBe("استلام من المكتب");
  });

  it("falls back to the raw value", () => {
    expect(deliveryTypeLabelAr("drone")).toBe("drone");
  });
});

describe("formatAr", () => {
  it("replaces placeholders", () => {
    expect(formatAr("عرض {from}-{to}", { from: 1, to: 9 })).toBe("عرض 1-9");
    expect(formatAr("{n} {products}", { n: 5, products: "منتجات" })).toBe(
      "5 منتجات"
    );
  });

  it("leaves unknown placeholders untouched", () => {
    expect(formatAr("لا {missing}", {})).toBe("لا {missing}");
  });
});

describe("arabicCount", () => {
  const forms: ArabicCountForms = {
    zero: "منتجات",
    one: "منتج",
    two: "منتجان",
    few: "منتجات",
    many: "منتجًا",
    other: "منتجًا",
  };

  it("uses the CLDR Arabic plural categories", () => {
    expect(arabicCount(0, forms)).toBe("0 منتجات");
    expect(arabicCount(1, forms)).toBe("1 منتج");
    expect(arabicCount(2, forms)).toBe("2 منتجان");
    expect(arabicCount(3, forms)).toBe("3 منتجات");
    expect(arabicCount(10, forms)).toBe("10 منتجات");
    expect(arabicCount(11, forms)).toBe("11 منتجًا");
    expect(arabicCount(99, forms)).toBe("99 منتجًا");
    expect(arabicCount(100, forms)).toBe("100 منتجًا");
    expect(arabicCount(1000, forms)).toBe("1000 منتجًا");
  });

  it("works with the shared product forms", () => {
    expect(arabicCount(1, productCountForms)).toBe("1 منتج");
    expect(arabicCount(4, productCountForms)).toBe("4 منتجات");
    expect(arabicCount(50, productCountForms)).toBe("50 منتجًا");
  });
});
