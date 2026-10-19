import { notFound } from "next/navigation";

import {
  getLandingPageForProduct,
  listTakenSlugs,
} from "@/lib/api/landing-admin";
import { getLandingOrderData } from "@/lib/landing/api";
import { ensureUniqueSlug, suggestSlug } from "@/lib/admin/landing-validation";
import { CreateLandingPageForm } from "./CreateLandingPageForm";
import { LandingPageEditor } from "./LandingPageEditor";

export const dynamic = "force-dynamic";

export default async function AdminLandingPageEditorPage({
  params,
}: {
  params: { productId: string };
}) {
  const data = await getLandingPageForProduct(params.productId);
  if (!data) notFound();

  if (!data.page) {
    const taken = await listTakenSlugs();
    const initialSlug = ensureUniqueSlug(
      suggestSlug(data.product.name),
      taken
    );
    return (
      <CreateLandingPageForm
        productId={data.product.id}
        productName={data.product.name}
        initialSlug={initialSlug}
      />
    );
  }

  return (
    <LandingPageEditor
      page={data.page}
      productName={data.product.name}
      imageUrls={data.imageUrls}
      order={await getLandingOrderData(data.product.id)}
    />
  );
}
