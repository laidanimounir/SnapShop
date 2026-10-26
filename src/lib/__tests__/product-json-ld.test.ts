import { describe, expect, it } from "vitest";

import { buildProductJsonLd } from "../seo/product-json-ld";
import type { Product } from "@/types/product.types";
import type { QuantityOffer } from "@/types/offer.types";

const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: "4a5b6c7d-0000-4000-8000-000000000001",
  name: "قميص قطني",
  description: "قميص قطني مريح للاستعمال اليومي",
  category: "رجالي",
  brand: "SnapShop",
  base_price: 2500,
  compare_at_price: null,
  discount_percentage: 0,
  discount_amount: 0,
  rating: 0,
  is_active: true,
  size_type: "clothing",
  created_at: "2026-01-01T00:00:00.000Z",
  images: [
    {
      id: "img-1",
      product_id: "4a5b6c7d-0000-4000-8000-000000000001",
      url: "https://cdn.example.com/shirt.jpg",
      alt_text: null,
      position: 0,
      is_primary: true,
      color: null,
    },
  ],
  variants: [
    {
      id: "var-1",
      product_id: "4a5b6c7d-0000-4000-8000-000000000001",
      color: null,
      color_hex: null,
      size: "M",
      price: null,
      stock_quantity: 3,
      sku: null,
      is_active: true,
    },
  ],
  ...overrides,
});

const makeOffer = (overrides: Partial<QuantityOffer> = {}): QuantityOffer => ({
  id: "offer-1",
  product_id: "4a5b6c7d-0000-4000-8000-000000000001",
  quantity: 2,
  total_price: 4500,
  label: null,
  badge: null,
  is_default: false,
  position: 0,
  is_active: true,
  ...overrides,
});

const input = (overrides: Partial<Parameters<typeof buildProductJsonLd>[0]> = {}) =>
  buildProductJsonLd({
    product: makeProduct(),
    offers: [],
    reviewCount: 0,
    siteUrl: "https://snapshop.test",
    path: "/shop/product/4a5b6c7d-0000-4000-8000-000000000001",
    breadcrumb: [
      { name: "الرئيسية", url: "/" },
      { name: "المتجر", url: "/shop" },
      { name: "قميص قطني", url: "/shop/product/4a5b6c7d-0000-4000-8000-000000000001" },
    ],
    ...overrides,
  });

type GraphNode = Record<string, unknown>;

const graphOf = (data: Record<string, unknown>): GraphNode[] =>
  data["@graph"] as GraphNode[];

const productNode = (data: Record<string, unknown>): GraphNode =>
  graphOf(data).find((node) => node["@type"] === "Product") as GraphNode;

const breadcrumbNode = (data: Record<string, unknown>): GraphNode =>
  graphOf(data).find(
    (node) => node["@type"] === "BreadcrumbList"
  ) as GraphNode;

describe("buildProductJsonLd", () => {
  it("emits a Product with a single offer from the real base price", () => {
    const data = input();
    const product = productNode(data);

    expect(data["@context"]).toBe("https://schema.org");
    expect(product.name).toEqual("قميص قطني");
    expect(product.brand).toEqual({ "@type": "Brand", name: "SnapShop" });

    const offers = product.offers as GraphNode[];
    expect(offers).toHaveLength(1);
    expect(offers[0]).toMatchObject({
      "@type": "Offer",
      price: 2500,
      priceCurrency: "DZD",
      availability: "https://schema.org/InStock",
      url: "https://snapshop.test/shop/product/4a5b6c7d-0000-4000-8000-000000000001",
    });
    expect(typeof offers[0].price).toBe("number");
  });

  it("emits one offer per active tier and ignores inactive tiers", () => {
    const data = input({
      offers: [
        makeOffer({ id: "o1", quantity: 2, total_price: 4500, position: 0 }),
        makeOffer({ id: "o2", quantity: 3, total_price: 6300, position: 1 }),
        makeOffer({
          id: "o3",
          quantity: 5,
          total_price: 10000,
          position: 2,
          is_active: false,
        }),
      ],
    });
    const offers = productNode(data).offers as GraphNode[];

    expect(offers).toHaveLength(2);
    expect(offers.map((offer) => offer.price)).toEqual([4500, 6300]);
  });

  it("marks the product out of stock when no active variant has stock", () => {
    const data = input({
      product: makeProduct({
        variants: [
          {
            id: "var-1",
            product_id: "4a5b6c7d-0000-4000-8000-000000000001",
            color: null,
            color_hex: null,
            size: "M",
            price: null,
            stock_quantity: 0,
            sku: null,
            is_active: true,
          },
        ],
      }),
    });
    const offers = productNode(data).offers as GraphNode[];

    expect(offers[0].availability).toBe("https://schema.org/OutOfStock");
  });

  it("adds aggregate rating only with a real rating and a review", () => {
    expect(productNode(input()).aggregateRating).toBeUndefined();

    const noReviews = input({ product: makeProduct({ rating: 4.8 }) });
    expect(productNode(noReviews).aggregateRating).toBeUndefined();

    const withReviews = input({
      product: makeProduct({ rating: 4.8 }),
      reviewCount: 3,
    });
    expect(productNode(withReviews).aggregateRating).toEqual({
      "@type": "AggregateRating",
      ratingValue: 4.8,
      reviewCount: 3,
    });
  });

  it("lists the visible breadcrumb trail with absolute urls", () => {
    const breadcrumb = breadcrumbNode(input());
    const items = breadcrumb.itemListElement as GraphNode[];

    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({
      position: 1,
      item: "https://snapshop.test/",
    });
    expect(items[1].item).toBe("https://snapshop.test/shop");
    expect(items[2].name).toEqual("قميص قطني");
  });

  it("keeps relative image urls but respects absolute ones", () => {
    const data = input({
      product: makeProduct({
        images: [
          {
            id: "img-1",
            product_id: "4a5b6c7d-0000-4000-8000-000000000001",
            url: "/uploads/shirt.jpg",
            alt_text: null,
            position: 0,
            is_primary: true,
            color: null,
          },
          {
            id: "img-2",
            product_id: "4a5b6c7d-0000-4000-8000-000000000001",
            url: "https://cdn.example.com/other.jpg",
            alt_text: null,
            position: 1,
            is_primary: false,
            color: null,
          },
        ],
      }),
    });

    expect(productNode(data).image).toEqual([
      "https://snapshop.test/uploads/shirt.jpg",
      "https://cdn.example.com/other.jpg",
    ]);
  });
});
