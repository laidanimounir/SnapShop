import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminProductById } from "@/lib/api/admin";
import { ar } from "@/lib/admin/i18n-ar";
import ProductEditor from "./ProductEditor";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await getAdminProductById(params.id);
  if (!product) notFound();

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">
          {ar.products.editTitle}: {product.name}
        </h1>
        <Link href="/admin/products" className="text-sm underline underline-offset-2">
          {ar.products.backToProducts}
        </Link>
      </div>
      <ProductEditor product={product} />
    </div>
  );
}
