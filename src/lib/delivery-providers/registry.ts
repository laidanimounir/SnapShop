import { ecotrackProvider } from "./ecotrack";
import type { DeliveryProvider, DeliveryProviderId } from "./types";

export const deliveryProviders: Record<DeliveryProviderId, DeliveryProvider> = {
  ecotrack: ecotrackProvider,
};

export function getDeliveryProvider(
  id: string
): DeliveryProvider | null {
  return (deliveryProviders as Record<string, DeliveryProvider>)[id] ?? null;
}
