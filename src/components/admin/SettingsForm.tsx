"use client";

import { useState } from "react";
import {
  saveDeliveryProviderAction,
  saveTrackingPixelAction,
} from "@/app/admin/actions";

type Props = {
  tracking: { pixel_id: string; enabled: boolean };
  provider: {
    masked_api_key: string;
    has_api_key: boolean;
    base_url: string;
    enabled: boolean;
  };
};

export default function SettingsForm({ tracking, provider }: Props) {
  const [pixelId, setPixelId] = useState(tracking.pixel_id);
  const [pixelEnabled, setPixelEnabled] = useState(tracking.enabled);
  const [savingPixel, setSavingPixel] = useState(false);
  const [pixelMessage, setPixelMessage] = useState<string | null>(null);

  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState(provider.base_url);
  const [providerEnabled, setProviderEnabled] = useState(provider.enabled);
  const [savingProvider, setSavingProvider] = useState(false);
  const [providerMessage, setProviderMessage] = useState<string | null>(null);

  const savePixel = async () => {
    setSavingPixel(true);
    setPixelMessage(null);
    const result = await saveTrackingPixelAction({
      pixel_id: pixelId,
      enabled: pixelEnabled,
    });
    setSavingPixel(false);
    setPixelMessage(
      result.ok ? "Tracking pixel settings saved." : result.error
    );
  };

  const saveProvider = async () => {
    setSavingProvider(true);
    setProviderMessage(null);
    const result = await saveDeliveryProviderAction({
      api_key: apiKey,
      base_url: baseUrl,
      enabled: providerEnabled,
    });
    setSavingProvider(false);
    if (result.ok) {
      setApiKey("");
      setProviderMessage("Delivery provider settings saved.");
    } else {
      setProviderMessage(result.error);
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-white border border-black/10 rounded-lg p-5 space-y-4">
        <div>
          <h2 className="font-semibold">Tracking Pixel</h2>
          <p className="text-sm text-black/60 mt-1">
            This form only SAVES the Pixel ID. No tracking script is injected
            yet.
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" htmlFor="pixel-id">
            Pixel ID (digits only, 5-20 characters)
          </label>
          <input
            id="pixel-id"
            value={pixelId}
            onChange={(e) => setPixelId(e.target.value)}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={20}
            placeholder="1234567890"
            className="w-full max-w-sm px-3 py-2 border border-black/15 rounded-lg text-sm"
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={pixelEnabled}
            onChange={(e) => setPixelEnabled(e.target.checked)}
          />
          Enable tracking pixel
        </label>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={savePixel}
            disabled={savingPixel}
            className="px-4 py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-black/80 disabled:opacity-50"
          >
            {savingPixel ? "Saving…" : "Save pixel settings"}
          </button>
          {pixelMessage && (
            <span className="text-sm text-black/60">{pixelMessage}</span>
          )}
        </div>
      </section>

      <section className="bg-white border border-black/10 rounded-lg p-5 space-y-4">
        <div>
          <h2 className="font-semibold">Delivery providers — EcoTrack</h2>
          <p className="text-sm text-black/60 mt-1">
            Credentials are stored server-side only. Integration is not
            implemented yet; the API documentation must be added first.
          </p>
        </div>

        <div>
          <span className="block text-xs font-medium mb-1">Current API key</span>
          <p className="font-mono text-sm text-black/70">
            {provider.masked_api_key}
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" htmlFor="api-key">
            New API key (leave empty to keep the current one)
          </label>
          <input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            autoComplete="new-password"
            placeholder={provider.has_api_key ? "••••••••" : "Paste API key"}
            className="w-full max-w-sm px-3 py-2 border border-black/15 rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" htmlFor="base-url">
            Base URL (optional, https only)
          </label>
          <input
            id="base-url"
            type="url"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.example.com"
            className="w-full max-w-sm px-3 py-2 border border-black/15 rounded-lg text-sm"
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={providerEnabled}
            onChange={(e) => setProviderEnabled(e.target.checked)}
          />
          Enable EcoTrack provider
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={saveProvider}
            disabled={savingProvider}
            className="px-4 py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-black/80 disabled:opacity-50"
          >
            {savingProvider ? "Saving…" : "Save provider settings"}
          </button>
          <button
            type="button"
            disabled
            title="Available after integration is implemented"
            className="px-4 py-2 rounded-lg border border-black/15 text-sm font-medium opacity-50 cursor-not-allowed"
          >
            Test connection
          </button>
          {providerMessage && (
            <span className="text-sm text-black/60">{providerMessage}</span>
          )}
        </div>
      </section>
    </div>
  );
}
