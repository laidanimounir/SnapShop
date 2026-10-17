import { getDeliveryZonesAdmin } from "@/lib/api/admin";
import DeliveryZonesEditor from "@/components/admin/DeliveryZonesEditor";

export const dynamic = "force-dynamic";

export default async function AdminDeliveryPage() {
  const zones = await getDeliveryZonesAdmin();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Delivery Prices</h1>
      <p className="text-sm text-black/60 mb-4">
        Home and office delivery prices per wilaya. The server uses these
        values when an order is placed; prices are never trusted from the
        browser. Inactive wilayas are hidden from checkout.
      </p>
      <DeliveryZonesEditor zones={zones} />
    </div>
  );
}
