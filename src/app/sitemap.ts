import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/api/products";

function siteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";
  return raw.replace(/\/$/, "");
}

const STATIC_ROUTES = [
  "/",
  "/shop",
  "/search",
  "/track-order",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/returns",
  "/shipping",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = siteOrigin();
  let products: { id: string }[] = [];
  try {
    const page = await getProducts({ pageSize: 100, sort: "newest" });
    products = page.products;
  } catch {
    products = [];
  }

  return [
    ...STATIC_ROUTES.map((route) => ({
      url: `${site}${route}`,
      lastModified: new Date(),
    })),
    ...products.map((p) => ({
      url: `${site}/shop/product/${p.id}`,
      lastModified: new Date(),
    })),
  ];
}
