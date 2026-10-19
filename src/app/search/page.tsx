import ProductCard from "@/components/common/ProductCard";
import { getProducts } from "@/lib/api/products";
import { getPublishedLandingSlugMap } from "@/lib/landing/api";
import {
  ar,
  arabicCount,
  formatAr,
  productCountForms,
} from "@/lib/store/i18n-ar";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const q = (searchParams.q as string) || "";
  const [{ products, total }, landingSlugs] = await Promise.all([
    getProducts({ search: q, pageSize: 24 }),
    getPublishedLandingSlugMap(),
  ]);

  return (
    <main className="pb-20">
      <div className="max-w-frame mx-auto px-4 xl:px-0">
        <div className="max-w-xl mt-6">
          <form action="/search" method="get" className="flex">
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder={ar.search.searchPlaceholder}
              className="w-full px-4 py-3 rounded-full border border-black/10 outline-none focus:border-black/30"
            />
          </form>
        </div>
        <h1 className="font-bold text-2xl md:text-[32px] mb-5 mt-6">
          {q
            ? formatAr(ar.search.resultsFor, { q })
            : ar.search.title}
        </h1>
        <span className="text-sm text-black/60">
          {arabicCount(total, productCountForms)}
        </span>

        {products.length > 0 ? (
          <div className="w-full grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5 mt-5">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                data={p}
                landingSlug={landingSlugs[p.id]}
              />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-black/50">
            {ar.search.noResults}
          </div>
        )}
      </div>
    </main>
  );
}
