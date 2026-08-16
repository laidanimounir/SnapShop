import { Suspense } from "react";
import BreadcrumbShop from "@/components/shop-page/BreadcrumbShop";
import MobileFilters from "@/components/shop-page/filters/MobileFilters";
import Filters from "@/components/shop-page/filters";
import SortSelect from "@/components/shop-page/SortSelect";
import { FiSliders } from "react-icons/fi";
import ProductCard from "@/components/common/ProductCard";
import { getProducts, type ProductFilters } from "@/lib/api/products";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type SearchParams = Record<string, string | string[] | undefined>;

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default async function ShopPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const category =
    (searchParams.category as string) || (searchParams.style as string) || undefined;
  const color = searchParams.color as string | undefined;
  const size = searchParams.size as string | undefined;
  const minPrice = searchParams.minPrice
    ? Number(searchParams.minPrice as string)
    : undefined;
  const maxPrice = searchParams.maxPrice
    ? Number(searchParams.maxPrice as string)
    : undefined;
  const sort = ((searchParams.sort as string) || "most-popular") as ProductFilters["sort"];
  const page = searchParams.page ? Number(searchParams.page as string) : 1;
  const pageSize = 9;

  const { products, total } = await getProducts({
    category,
    color,
    size,
    minPrice,
    maxPrice,
    sort,
    page,
    pageSize,
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  const buildHref = (p: number) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (color) params.set("color", color);
    if (size) params.set("size", size);
    if (searchParams.minPrice) params.set("minPrice", String(searchParams.minPrice));
    if (searchParams.maxPrice) params.set("maxPrice", String(searchParams.maxPrice));
    if (sort && sort !== "most-popular") params.set("sort", sort);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/shop?${qs}` : "/shop";
  };

  return (
    <main className="pb-20">
      <div className="max-w-frame mx-auto px-4 xl:px-0">
        <hr className="h-[1px] border-t-black/10 mb-5 sm:mb-6" />
        <BreadcrumbShop />
        <div className="flex md:space-x-5 items-start">
          <div className="hidden md:block min-w-[295px] max-w-[295px] border border-black/10 rounded-[20px] px-5 md:px-6 py-5 space-y-5 md:space-y-6">
            <div className="flex items-center justify-between">
              <span className="font-bold text-black text-xl">Filters</span>
              <FiSliders className="text-2xl text-black/40" />
            </div>
            <Suspense fallback={null}>
              <Filters />
            </Suspense>
          </div>
          <div className="flex flex-col w-full space-y-5">
            <div className="flex flex-col lg:flex-row lg:justify-between">
              <div className="flex items-center justify-between">
                <h1 className="font-bold text-2xl md:text-[32px]">
                  {category ? capitalize(category) : "Shop"}
                </h1>
                <Suspense fallback={null}>
                  <MobileFilters />
                </Suspense>
              </div>
              <div className="flex flex-col sm:items-center sm:flex-row">
                <span className="text-sm md:text-base text-black/60 mr-3">
                  Showing {from}-{to} of {total} Products
                </span>
                <div className="flex items-center">
                  Sort by:{" "}
                  <Suspense fallback={null}>
                    <SortSelect />
                  </Suspense>
                </div>
              </div>
            </div>

            {products.length > 0 ? (
              <div className="w-full grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
                {products.map((product) => (
                  <ProductCard key={product.id} data={product} />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center text-black/50">
                No products match your filters.
              </div>
            )}

            <hr className="border-t-black/10" />
            {totalPages > 1 && (
              <Pagination className="justify-between">
                <PaginationPrevious
                  href={page > 1 ? buildHref(page - 1) : "#"}
                  className="border border-black/10"
                />
                <PaginationContent>
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const n = i + 1;
                    return (
                      <PaginationItem key={n}>
                        <PaginationLink
                          href={buildHref(n)}
                          isActive={n === page}
                          className="text-black/50 font-medium text-sm"
                        >
                          {n}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                </PaginationContent>
                <PaginationNext
                  href={page < totalPages ? buildHref(page + 1) : "#"}
                  className="border border-black/10"
                />
              </Pagination>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
