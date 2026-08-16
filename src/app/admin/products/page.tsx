import Link from "next/link";
import { getAdminProducts } from "@/lib/api/admin";
import { setProductActive } from "@/app/admin/actions";
import { formatPrice } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await getAdminProducts();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Products</h1>
      <div className="bg-white border border-black/10 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left text-black/60">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Base price</th>
              <th className="px-4 py-3 font-medium">Rating</th>
              <th className="px-4 py-3 font-medium">Variants</th>
              <th className="px-4 py-3 font-medium">Active</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-black/5 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="underline underline-offset-2"
                  >
                    {product.name}
                  </Link>
                </td>
                <td className="px-4 py-3">{product.category ?? "-"}</td>
                <td className="px-4 py-3">{formatPrice(product.base_price)}</td>
                <td className="px-4 py-3">{product.rating.toFixed(1)}</td>
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
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-black/50">
                  No products yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
