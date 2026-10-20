import { listTemplatesDetailed } from "@/lib/api/landing-admin";
import { ar } from "@/lib/admin/i18n-ar";
import { TemplatesTable } from "./TemplatesTable";

export const dynamic = "force-dynamic";

export default async function AdminLandingTemplatesPage() {
  const templates = await listTemplatesDetailed();

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold">{ar.landing.templatesPage.title}</h1>
        <p className="text-sm text-black/60 mt-1 max-w-2xl">
          {ar.landing.templatesPage.intro}
        </p>
      </div>

      <TemplatesTable templates={templates} />
    </div>
  );
}
