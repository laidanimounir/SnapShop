import { getStoreSettings } from "@/lib/api/store-settings";
import { maskSecret } from "@/lib/admin/settings-validation";
import { ar } from "@/lib/admin/i18n-ar";
import SettingsForm from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const { tracking, provider } = await getStoreSettings();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">{ar.settings.title}</h1>
      <p className="text-sm text-black/60 mb-4">{ar.settings.intro}</p>
      <SettingsForm
        tracking={{
          pixel_id: tracking.pixel_id,
          enabled: tracking.enabled,
        }}
        provider={{
          // Only the masked suffix leaves the server.
          masked_api_key: provider.api_key
            ? maskSecret(provider.api_key)
            : ar.settings.notSet,
          has_api_key: provider.api_key.length > 0,
          base_url: provider.base_url,
          enabled: provider.enabled,
        }}
      />
    </div>
  );
}
