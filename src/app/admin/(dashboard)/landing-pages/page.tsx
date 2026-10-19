import Link from "next/link";

import { getAdminLandingPages, type AdminLandingRow } from "@/lib/api/landing-admin";
import { ar } from "@/lib/admin/i18n-ar";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

const STATUS_STYLES: Record<string, string> = {
  none: "bg-gray-200 text-gray-600",
  draft: "bg-amber-100 text-amber-800",
  published: "bg-green-100 text-green-800",
  unpublished: "bg-gray-200 text-gray-600",
};

function statusLabel(status: string | null): string {
  switch (status) {
    case "draft":
      return ar.landing.draft;
    case "published":
      return ar.landing.published;
    case "unpublished":
      return ar.landing.unpublished;
    default:
      return ar.landing.none;
  }
}

function StatusBadge({ page }: { page: AdminLandingRow["page"] }) {
  const key = page?.status ?? "none";
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
        STATUS_STYLES[key] ?? STATUS_STYLES.none
      }`}
    >
      {statusLabel(page?.status ?? null)}
    </span>
  );
}

export default async function AdminLandingPagesPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; page?: string };
}) {
  const all = await getAdminLandingPages();
  const q = (searchParams.q ?? "").trim().toLowerCase();
  const statusFilter = searchParams.status ?? "all";
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);

  const filtered = all.filter((row) => {
    const status = row.page?.status ?? "none";
    if (statusFilter !== "all" && status !== statusFilter) return false;
    if (q && !row.product.name.toLowerCase().includes(q)) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const items = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const hrefFor = (over: Record<string, string>) => {
    const params = new URLSearchParams();
    if (over.q ?? q) params.set("q", over.q ?? q);
    if (over.status ?? statusFilter) {
      params.set("status", over.status ?? statusFilter);
    }
    params.set("page", over.page ?? String(safePage));
    return `/admin/landing-pages?${params.toString()}`;
  };

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold">{ar.landing.title}</h1>
        <p className="text-sm text-black/60 mt-1 max-w-2xl">
          {ar.landing.intro}
        </p>
      </div>

      <form method="get" className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          name="q"
          defaultValue={searchParams.q ?? ""}
          placeholder={ar.landing.searchPlaceholder}
          className="px-3 py-2 border border-black/15 rounded-lg text-sm w-64"
        />
        <select
          name="status"
          defaultValue={statusFilter}
          className="px-3 py-2 border border-black/15 rounded-lg text-sm"
        >
          <option value="all">{ar.common.all}</option>
          <option value="none">{ar.landing.none}</option>
          <option value="draft">{ar.landing.draft}</option>
          <option value="published">{ar.landing.published}</option>
          <option value="unpublished">{ar.landing.unpublished}</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg border border-black/15 text-sm font-medium hover:bg-gray-100"
        >
          {ar.common.filter}
        </button>
      </form>

      <div className="bg-white border border-black/10 rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[680px]">
          <thead>
            <tr className="border-b border-black/10 text-start text-black/60">
              <th className="px-4 py-3 font-medium text-start">
                {ar.landing.product}
              </th>
              <th className="px-4 py-3 font-medium text-start">
                {ar.landing.pageStatus}
              </th>
              <th className="px-4 py-3 font-medium text-start">
                {ar.landing.lastSaved}
              </th>
              <th className="px-4 py-3 font-medium text-start">
                {ar.common.actions}
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr
                key={row.product.id}
                className="border-b border-black/5 hover:bg-gray-50"
              >
                <td className="px-4 py-3">
                  <div className="font-medium">{row.product.name}</div>
                  <div className="text-xs text-black/50">
                    {row.product.category ?? "-"}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge page={row.page} />
                  {row.page ? (
                    <div
                      dir="ltr"
                      className="text-xs text-black/50 mt-1 font-mono text-left"
                    >
                      /p/{row.page.slug}
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-black/70">
                  {row.page
                    ? new Date(row.page.updated_at).toLocaleDateString("en-GB")
                    : "-"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/landing-pages/${row.product.id}`}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-black text-white hover:bg-black/80"
                    >
                      {row.page ? ar.landing.edit : ar.landing.create}
                    </Link>
                    {row.page?.status === "published" ? (
                      <a
                        href={`/p/${row.page.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 rounded-full text-xs font-medium border border-black/15 hover:bg-gray-100"
                      >
                        {ar.landing.view}
                      </a>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-black/50">
                  {ar.landing.noProducts}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2 mt-4 text-sm">
          <span className="text-black/60">
            {ar.common.page} {safePage} {ar.common.of} {totalPages}
          </span>
          {safePage > 1 && (
            <Link
              href={hrefFor({ page: String(safePage - 1) })}
              className="px-3 py-1 rounded-lg border border-black/15 hover:bg-gray-100"
            >
              {ar.common.previous}
            </Link>
          )}
          {safePage < totalPages && (
            <Link
              href={hrefFor({ page: String(safePage + 1) })}
              className="px-3 py-1 rounded-lg border border-black/15 hover:bg-gray-100"
            >
              {ar.common.next}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
