import Link from "next/link";
import { getAdminProductById } from "@/lib/api/admin";
import { formatPrice } from "@/lib/pricing";
import { ar } from "@/lib/admin/i18n-ar";

export const dynamic = "force-dynamic";

export default async function AdminProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await getAdminProductById(params.id);

  if (!product) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">{ar.products.product}</h1>
        <p className="text-black/50">{ar.products.notFound}</p>
        <Link href="/admin/products" className="text-sm underline underline-offset-2">
          {ar.products.backToProducts}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <Link href="/admin/products" className="text-sm underline underline-offset-2">
          {ar.products.backToProducts}
        </Link>
      </div>

      <div className="bg-white border border-black/10 rounded-lg p-5 mb-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
        <p>
          <span className="text-black/60">{ar.common.category}:</span>{" "}
          {product.category ?? "-"}
        </p>
        <p>
          <span className="text-black/60">{ar.common.brand}:</span>{" "}
          {product.brand ?? "-"}
        </p>
        <p>
          <span className="text-black/60">{ar.products.basePrice}:</span>{" "}
          {formatPrice(product.base_price)}
        </p>
        <p>
          <span className="text-black/60">{ar.products.rating}:</span>{" "}
          {product.rating.toFixed(1)}
        </p>
        <p>
          <span className="text-black/60">{ar.products.discountPct}:</span>{" "}
          {product.discount_percentage}
        </p>
        <p>
          <span className="text-black/60">{ar.products.discountAmount}:</span>{" "}
          {formatPrice(product.discount_amount)}
        </p>
        <p>
          <span className="text-black/60">{ar.common.active}:</span>{" "}
          {product.is_active ? ar.common.yes : ar.common.no}
        </p>
        <p className="md:col-span-2">
          <span className="text-black/60">{ar.common.description}:</span>{" "}
          {product.description}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-black/10 rounded-lg p-5">
          <h2 className="font-semibold mb-3">
            {ar.common.variants} ({product.variants.length})
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 text-start text-black/60">
                <th className="py-2 font-medium text-start">{ar.common.color}</th>
                <th className="py-2 font-medium text-start">{ar.common.size}</th>
                <th className="py-2 font-medium text-start">{ar.common.stock}</th>
                <th className="py-2 font-medium text-start">{ar.common.sku}</th>
                <th className="py-2 font-medium text-start">{ar.common.price}</th>
              </tr>
            </thead>
            <tbody>
              {product.variants.map((variant) => (
                <tr key={variant.id} className="border-b border-black/5">
                  <td className="py-2">{variant.color}</td>
                  <td className="py-2">{variant.size}</td>
                  <td className="py-2">
                    <span className={variant.stock_quantity <= 0 ? "text-red-600" : ""}>
                      {variant.stock_quantity}
                    </span>
                  </td>
                  <td className="py-2 font-mono text-xs">{variant.sku ?? "-"}</td>
                  <td className="py-2">
                    {variant.price != null
                      ? formatPrice(variant.price)
                      : ar.products.inherit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-black/10 rounded-lg p-5">
          <h2 className="font-semibold mb-3">
            {ar.common.images} ({product.images.length})
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {product.images.map((image) => (
              <div key={image.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt={product.name}
                  className="w-full aspect-square object-cover rounded-lg border border-black/10"
                />
                {image.is_primary && (
                  <span className="absolute top-1 start-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                    {ar.products.primary}
                  </span>
                )}
              </div>
            ))}
            {product.images.length === 0 && (
              <p className="text-black/50 col-span-3">{ar.products.noImages}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
