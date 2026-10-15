import Link from "next/link";
import NewProductForm from "./NewProductForm";

export const dynamic = "force-dynamic";

export default function NewProductPage() {
  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">New product</h1>
        <Link href="/admin/products" className="text-sm underline underline-offset-2">
          Back to products
        </Link>
      </div>
      <p className="text-sm text-black/60 mb-4">
        The product is created as an inactive draft first — you add
        images, colors, sizes and stock on the next page.
      </p>
      <NewProductForm />
    </div>
  );
}
