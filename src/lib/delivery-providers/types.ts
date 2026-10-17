// Typed contract for delivery-provider integrations. Nothing here calls
// a network: providers are registered stubs until their integration is
// deliberately implemented.

export type DeliveryProviderId = "ecotrack";

export type DeliveryProviderConfig = {
  apiKey: string;
  baseUrl: string;
  enabled: boolean;
};

export type CreateShipmentInput = {
  orderId: string;
  customerName: string;
  phone: string;
  address: string;
  wilayaCode: number | null;
  deliveryType: "home" | "office";
  totalToCollect: number;
};

export type CreateShipmentResult = {
  trackingNumber: string;
};

export interface DeliveryProvider {
  id: DeliveryProviderId;
  label: string;
  /** Throws until the provider integration is implemented. */
  testConnection(config: DeliveryProviderConfig): Promise<void>;
  /** Throws until the provider integration is implemented. */
  createShipment(
    config: DeliveryProviderConfig,
    input: CreateShipmentInput
  ): Promise<CreateShipmentResult>;
}
