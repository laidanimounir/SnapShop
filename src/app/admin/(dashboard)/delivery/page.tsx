import { getDeliveryZonesAdmin } from "@/lib/api/admin";
import DeliveryZonesEditor from "@/components/admin/DeliveryZonesEditor";
import { ar } from "@/lib/admin/i18n-ar";

export const dynamic = "force-dynamic";

export default async function AdminDeliveryPage() {
  const zones = await getDeliveryZonesAdmin();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">{ar.delivery.title}</h1>
      <p className="text-sm text-black/60 mb-4">{ar.delivery.intro}</p>
      <DeliveryZonesEditor zones={zones} />
    </div>
  );
}
