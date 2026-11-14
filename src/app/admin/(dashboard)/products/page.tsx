import Link from "next/link";
import { Plus } from "lucide-react";

import { ProductsTable } from "@/components/admin/products/products-table";
import { Button } from "@/components/admin/ui/button";
import { getAdminProducts } from "@/lib/api/admin";
import { ar } from "@/lib/admin/i18n-ar";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await getAdminProducts();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {ar.products.title}
          </h1>
          <p className="text-sm text-admin-muted-foreground">
            {products.length} {ar.products.results}
          </p>
        </div>

        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="size-4" />
            {ar.products.newProduct}
          </Link>
        </Button>
      </div>

      <ProductsTable products={products} />
    </div>
  );
}
