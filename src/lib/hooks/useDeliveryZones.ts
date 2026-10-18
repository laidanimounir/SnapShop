"use client";

import { useEffect, useState } from "react";
import { fetchDeliveryZones } from "@/lib/api/delivery";
import type { DeliveryZone } from "@/lib/delivery";
import { ar } from "@/lib/store/i18n-ar";

export type DeliveryZonesState = {
  zones: DeliveryZone[];
  zonesLoading: boolean;
  zonesError: string | null;
};

/** Loads the active delivery zones once per mount. */
export function useDeliveryZones(): DeliveryZonesState {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [zonesError, setZonesError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchDeliveryZones()
      .then((rows) => {
        if (!cancelled) {
          setZones(rows);
          setZonesLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setZonesError(ar.checkout.validation.zonesError);
          setZonesLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { zones, zonesLoading, zonesError };
}
