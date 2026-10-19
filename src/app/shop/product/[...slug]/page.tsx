import ProductListSec from "@/components/common/ProductListSec";
import BreadcrumbProduct from "@/components/product-page/BreadcrumbProduct";
import Header from "@/components/product-page/Header";
import Tabs from "@/components/product-page/Tabs";
import { getProductById, getProducts, getApprovedReviews } from "@/lib/api/products";
import {
  getPublishedLandingSlugForProduct,
  getPublishedLandingSlugMap,
} from "@/lib/landing/api";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ar, truncateGraphemes } from "@/lib/store/i18n-ar";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata({
  params,
}: {
  params: { slug: string[] };
}): Promise<Metadata> {
  const product = await getProductById(params.slug[0]).catch(() => null);
  if (!product) return { title: ar.meta.notFoundTitle };
  const description = truncateGraphemes(product.description, 160);
  const primary =
    product.images.find((i) => i.is_primary) ?? product.images[0];
  const path = `/shop/product/${product.id}`;
  return {
    title: product.name,
    description,
    alternates: {
      canonical: `${SITE_URL.replace(/\/$/, "")}${path}`,
    },
    openGraph: {
      title: product.name,
      description,
      locale: ar.meta.ogLocale,
      ...(primary ? { images: [{ url: primary.url }] } : {}),
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: { slug: string[] };
}) {
  const productId = params.slug[0];

  // When the product has a published landing page, the landing page is the
  // canonical storefront page for it: send visitors there instead.
  const landingSlug = await getPublishedLandingSlugForProduct(productId);
  if (landingSlug) redirect(`/p/${landingSlug}`);

  const product = await getProductById(productId);

  if (!product) {
    notFound();
  }

  const [reviews, { products: related }, landingSlugs] = await Promise.all([
    getApprovedReviews(productId),
    getProducts({ pageSize: 5, sort: "most-popular" }),
    getPublishedLandingSlugMap(),
  ]);

  return (
    <main>
      <div className="max-w-frame mx-auto px-4 xl:px-0">
        <hr className="h-[1px] border-t-black/10 mb-5 sm:mb-6" />
        <BreadcrumbProduct title={product.name} />
        <section className="mb-11">
          <Header product={product} />
        </section>
        <Tabs reviews={reviews} product={product} />
      </div>
      <div className="mb-[50px] sm:mb-20">
        <ProductListSec
          title={ar.product.youMightAlsoLike}
          data={related.filter((p) => p.id !== productId)}
          landingSlugs={landingSlugs}
        />
      </div>
    </main>
  );
}
