import { getStoreSettings } from "@/lib/api/store-settings";
import { maskSecret } from "@/lib/admin/settings-validation";
import SettingsForm from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const { tracking, provider } = await getStoreSettings();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Settings</h1>
      <p className="text-sm text-black/60 mb-4">
        Server-side settings. Secrets are stored with the service role and are
        never sent to the browser in full.
      </p>
      <SettingsForm
        tracking={{
          pixel_id: tracking.pixel_id,
          enabled: tracking.enabled,
        }}
        provider={{
          // Only the masked suffix leaves the server.
          masked_api_key: maskSecret(provider.api_key),
          has_api_key: provider.api_key.length > 0,
          base_url: provider.base_url,
          enabled: provider.enabled,
        }}
      />
    </div>
  );
}
