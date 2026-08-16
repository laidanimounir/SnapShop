import ProductListSec from "@/components/common/ProductListSec";
import BreadcrumbProduct from "@/components/product-page/BreadcrumbProduct";
import Header from "@/components/product-page/Header";
import Tabs from "@/components/product-page/Tabs";
import { getProductById, getProducts, getApprovedReviews } from "@/lib/api/products";
import { notFound } from "next/navigation";

export default async function ProductPage({
  params,
}: {
  params: { slug: string[] };
}) {
  const productId = params.slug[0];
  const product = await getProductById(productId);

  if (!product) {
    notFound();
  }

  const [reviews, { products: related }] = await Promise.all([
    getApprovedReviews(productId),
    getProducts({ pageSize: 5, sort: "most-popular" }),
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
          title="You might also like"
          data={related.filter((p) => p.id !== productId)}
        />
      </div>
    </main>
  );
}
