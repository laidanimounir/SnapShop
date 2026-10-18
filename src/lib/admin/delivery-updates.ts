// Pure payload builder for delivery-zone writes.
//
// The previous implementation used an upsert whose INSERT tuple omitted the
// NOT NULL columns name_ar/name_fr, so Postgres rejected it with SQLSTATE
// 23502 before ON CONFLICT could fire. Building the payload here (and using
// per-row UPDATE in the data layer) guarantees only mutable price/active
// columns are ever written and never the name columns.

export type DeliveryZoneUpdateInput = {
  wilaya_code: number;
  home_price: number;
  office_price: number;
  is_active: boolean;
};

export type DeliveryZoneUpdatePayload = DeliveryZoneUpdateInput & {
  updated_at: string;
};

export function buildDeliveryZoneUpdates(
  rows: DeliveryZoneUpdateInput[],
  now: string = new Date().toISOString()
): DeliveryZoneUpdatePayload[] {
  return rows.map((row) => ({
    wilaya_code: row.wilaya_code,
    home_price: row.home_price,
    office_price: row.office_price,
    is_active: row.is_active,
    updated_at: now,
  }));
}
