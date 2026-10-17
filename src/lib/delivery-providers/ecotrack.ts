import type {
  CreateShipmentInput,
  CreateShipmentResult,
  DeliveryProvider,
  DeliveryProviderConfig,
} from "./types";

// The real EcoTrack API format is NOT known yet. Do not guess it: the
// official documentation must be pasted into docs/providers/ecotrack.md
// before this stub is implemented.
const NOT_IMPLEMENTED = "Not implemented: see docs/providers/ecotrack.md";

export const ecotrackProvider: DeliveryProvider = {
  id: "ecotrack",
  label: "EcoTrack",
  async testConnection(_config: DeliveryProviderConfig): Promise<void> {
    void _config;
    throw new Error(NOT_IMPLEMENTED);
  },
  async createShipment(
    _config: DeliveryProviderConfig,
    _input: CreateShipmentInput
  ): Promise<CreateShipmentResult> {
    void _config;
    void _input;
    throw new Error(NOT_IMPLEMENTED);
  },
};
