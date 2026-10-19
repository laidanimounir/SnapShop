import { describe, expect, it } from "vitest";
import {
  shapeLandingOrderData,
  type RawDeliveryZone,
  type RawLandingProduct,
  type RawLandingVariant,
} from "../order-data";

const product: RawLandingProduct = {
  id: " 11111111-1111-1111-1111-111111111111 ",
  name: "قميص قطني",
  base_price: "2500",
  discount_percentage: "10",
  discount_amount: null,
  size_type: "clothing",
};

const variants: RawLandingVariant[] = [
  {
    id: "22222222-2222-2222-2222-222222222222",
    color: " أحمر ",
    color_hex: "#ff0000",
    size: " M ",
    price: null,
    stock_quantity: "5",
    is_active: true,
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    color: "أزرق",
    color_hex: "",
    size: "L",
    price: 3000,
    stock_quantity: 0,
    is_active: false,
  },
];

const zones: RawDeliveryZone[] = [
  {
    wilaya_code: "16",
    name_ar: "الجزائر",
    name_fr: "Alger",
    home_price: "400",
    office_price: 200,
    is_active: true,
  },
  {
    wilaya_code: 31,
    name_ar: "وهران",
    name_fr: "Oran",
    home_price: 500,
    office_price: 250,
    is_active: true,
  },
];

describe("shapeLandingOrderData", () => {
  it("shapes a valid product, active variants and active zones", () => {
    const shaped = shapeLandingOrderData(product, variants, zones);
    expect(shaped).not.toBeNull();
    expect(shaped?.productId).toBe(
      "11111111-1111-1111-1111-111111111111"
    );
    expect(shaped?.name).toBe("قميص قطني");
    expect(shaped?.basePrice).toBe(2500);
    expect(shaped?.discountPercentage).toBe(10);
    expect(shaped?.discountAmount).toBe(0);
    expect(shaped?.sizeType).toBe("clothing");
    expect(shaped?.variants).toEqual([
      {
        id: "22222222-2222-2222-2222-222222222222",
        color: "أحمر",
        colorHex: "#ff0000",
        size: "M",
        price: null,
        stock: 5,
      },
    ]);
    expect(shaped?.zones).toEqual([
      {
        wilaya_code: 16,
        name_ar: "الجزائر",
        name_fr: "Alger",
        home_price: 400,
        office_price: 200,
      },
      {
        wilaya_code: 31,
        name_ar: "وهران",
        name_fr: "Oran",
        home_price: 500,
        office_price: 250,
      },
    ]);
  });

  it("returns null for a missing product row", () => {
    expect(shapeLandingOrderData(null, variants, zones)).toBeNull();
    expect(shapeLandingOrderData(undefined, [], [])).toBeNull();
  });

  it("returns null when the base price is unusable", () => {
    expect(
      shapeLandingOrderData({ ...product, base_price: "free" }, [], [])
    ).toBeNull();
    expect(
      shapeLandingOrderData({ ...product, base_price: -5 }, [], [])
    ).toBeNull();
  });

  it("normalises discounts and an unknown size type", () => {
    const shaped = shapeLandingOrderData(
      {
        ...product,
        discount_percentage: 150,
        discount_amount: -20,
        size_type: "hats",
      },
      [],
      []
    );
    expect(shaped?.discountPercentage).toBe(100);
    expect(shaped?.discountAmount).toBe(0);
    expect(shaped?.sizeType).toBe("none");
  });

  it("drops junk variants and normalises stock and empty strings", () => {
    const shaped = shapeLandingOrderData(product, [
      { id: "", color: "x", stock_quantity: 3 },
      { id: "dup", color: "a", stock_quantity: 1 },
      { id: "dup", color: "b", stock_quantity: 2 },
      { id: "ok", color: "  ", size: "", price: -1, stock_quantity: -7 },
      { id: "off", color: "c", stock_quantity: 4, is_active: false },
    ], []);
    expect(shaped?.variants).toEqual([
      { id: "dup", color: "a", colorHex: null, size: null, price: null, stock: 1 },
      { id: "ok", color: null, colorHex: null, size: null, price: null, stock: 0 },
    ]);
  });

  it("drops junk zone rows and sorts by wilaya code", () => {
    const shaped = shapeLandingOrderData(product, [], [
      { wilaya_code: 0, name_ar: "x", home_price: 1, office_price: 1 },
      { wilaya_code: 1.5, name_ar: "x", home_price: 1, office_price: 1 },
      { wilaya_code: 7, name_ar: "  ", home_price: 1, office_price: 1 },
      { wilaya_code: 9, name_ar: "x", home_price: "a", office_price: 1 },
      { wilaya_code: 10, name_ar: "y", home_price: 1, office_price: 1, is_active: false },
      { wilaya_code: "16", name_ar: "الجزائر", home_price: 400, office_price: 200 },
    ]);
    expect(shaped?.zones).toEqual([
      { wilaya_code: 16, name_ar: "الجزائر", name_fr: "", home_price: 400, office_price: 200 },
    ]);
  });

  it("handles null variant and zone arrays", () => {
    const shaped = shapeLandingOrderData(product, null, null);
    expect(shaped?.variants).toEqual([]);
    expect(shaped?.zones).toEqual([]);
  });

  it("does not mutate its inputs", () => {
    const variantCopy = JSON.parse(JSON.stringify(variants));
    const zoneCopy = JSON.parse(JSON.stringify(zones));
    shapeLandingOrderData(product, variants, zones);
    expect(variants).toEqual(variantCopy);
    expect(zones).toEqual(zoneCopy);
  });
});
