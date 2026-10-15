import Link from "next/link";
import { getAdminProducts } from "@/lib/api/admin";
import { setProductActive } from "@/app/admin/actions";
import { formatPrice } from "@/lib/pricing";
import DeleteProductButton from "./DeleteProductButton";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: { q?: string; active?: string; page?: string };
}) {
  const all = await getAdminProducts();
  const q = (searchParams.q ?? "").trim().toLowerCase();
  const activeFilter = searchParams.active ?? "all";
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);

  const filtered = all.filter((p) => {
    if (activeFilter === "active" && !p.is_active) return false;
    if (activeFilter === "inactive" && p.is_active) return false;
    if (q && !`${p.name} ${p.category ?? ""}`.toLowerCase().includes(q)) {
      return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const items = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const hrefFor = (over: Record<string, string>) => {
    const params = new URLSearchParams();
    if (over.q ?? q) params.set("q", over.q ?? q);
    if (over.active ?? activeFilter) params.set("active", over.active ?? activeFilter);
    if (over.page ?? String(safePage)) params.set("page", over.page ?? String(safePage));
    return `/admin/products?${params.toString()}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Products ({filtered.length})</h1>
        <Link
          href="/admin/products/new"
          className="px-4 py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-black/80"
        >
          New product
        </Link>
      </div>

      <form method="get" className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          name="q"
          defaultValue={searchParams.q ?? ""}
          placeholder="Search name or category…"
          className="px-3 py-2 border border-black/15 rounded-lg text-sm w-64"
        />
        <select
          name="active"
          defaultValue={activeFilter}
          className="px-3 py-2 border border-black/15 rounded-lg text-sm"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg border border-black/15 text-sm font-medium hover:bg-gray-100"
        >
          Filter
        </button>
      </form>

      <div className="bg-white border border-black/10 rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead>
            <tr className="border-b border-black/10 text-left text-black/60">
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Variants</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((product) => (
              <tr key={product.id} className="border-b border-black/5 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                      {product.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.thumbnail_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : null}
                    </div>
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="underline underline-offset-2 font-medium"
                    >
                      {product.name}
                    </Link>
                  </div>
                </td>
                <td className="px-4 py-3">{product.category ?? "-"}</td>
                <td className="px-4 py-3">{formatPrice(product.base_price)}</td>
                <td className="px-4 py-3">
                  <span className={product.total_stock <= 0 ? "text-red-600" : ""}>
                    {product.total_stock}
                  </span>
                </td>
                <td className="px-4 py-3">{product.variant_count}</td>
                <td className="px-4 py-3">
                  <form action={setProductActive.bind(null, product.id)}>
                    <input
                      type="hidden"
                      name="is_active"
                      value={String(!product.is_active)}
                    />
                    <button
                      type="submit"
                      title="Toggle active"
                      className={
                        product.is_active
                          ? "px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                          : "px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-600"
                      }
                    >
                      {product.is_active ? "Active" : "Inactive"}
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="px-3 py-1 rounded-full text-xs font-medium border border-black/15 hover:bg-gray-100"
                    >
                      Edit
                    </Link>
                    <DeleteProductButton id={product.id} name={product.name} />
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-black/50">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2 mt-4 text-sm">
          <span className="text-black/60">
            Page {safePage} of {totalPages}
          </span>
          {safePage > 1 && (
            <Link
              href={hrefFor({ page: String(safePage - 1) })}
              className="px-3 py-1 rounded-lg border border-black/15 hover:bg-gray-100"
            >
              Previous
            </Link>
          )}
          {safePage < totalPages && (
            <Link
              href={hrefFor({ page: String(safePage + 1) })}
              className="px-3 py-1 rounded-lg border border-black/15 hover:bg-gray-100"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
