import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminProductById } from "@/lib/api/admin";
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
        <h1 className="text-2xl font-bold">Edit: {product.name}</h1>
        <Link href="/admin/products" className="text-sm underline underline-offset-2">
          Back to products
        </Link>
      </div>
      <ProductEditor product={product} />
    </div>
  );
}
