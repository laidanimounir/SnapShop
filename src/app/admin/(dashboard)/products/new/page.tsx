import Link from "next/link";
import NewProductForm from "./NewProductForm";
import { ar } from "@/lib/admin/i18n-ar";

export const dynamic = "force-dynamic";

export default function NewProductPage() {
  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{ar.products.newProduct}</h1>
        <Link href="/admin/products" className="text-sm underline underline-offset-2">
          {ar.products.backToProducts}
        </Link>
      </div>
      <p className="text-sm text-black/60 mb-4">{ar.products.newIntro}</p>
      <NewProductForm />
    </div>
  );
}
