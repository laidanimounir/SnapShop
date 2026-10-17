"use client";

import { useMemo, useState } from "react";
import type { AdminDeliveryZone } from "@/lib/api/admin";
import {
  bulkSetDeliveryPricesAction,
  saveAllDeliveryZonesAction,
  saveDeliveryZoneAction,
} from "@/app/admin/actions";
import {
  parseDeliveryPrice,
  validateDeliveryPrice,
} from "@/lib/admin/delivery-validation";
import { ar, formatAr } from "@/lib/admin/i18n-ar";
import { cn } from "@/lib/utils";

type DraftRow = {
  wilaya_code: number;
  name_ar: string;
  name_fr: string;
  home: string;
  office: string;
  is_active: boolean;
};

function toDrafts(zones: AdminDeliveryZone[]): DraftRow[] {
  return zones.map((z) => ({
    wilaya_code: z.wilaya_code,
    name_ar: z.name_ar,
    name_fr: z.name_fr,
    home: String(z.home_price),
    office: String(z.office_price),
    is_active: z.is_active,
  }));
}

export default function DeliveryZonesEditor({
  zones,
}: {
  zones: AdminDeliveryZone[];
}) {
  const [rows, setRows] = useState<DraftRow[]>(() => toDrafts(zones));
  const [search, setSearch] = useState("");
  const [bulkPrice, setBulkPrice] = useState("600");
  const [savingCode, setSavingCode] = useState<number | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [bulking, setBulking] = useState<"home" | "office" | null>(null);
  const [toast, setToast] = useState<{ message: string; error: boolean } | null>(
    null
  );

  const showToast = (message: string, error = false) => {
    setToast({ message, error });
    window.setTimeout(() => setToast(null), 3500);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        String(r.wilaya_code).includes(q) ||
        r.name_ar.toLowerCase().includes(q) ||
        r.name_fr.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const updateRow = (code: number, patch: Partial<DraftRow>) => {
    setRows((prev) =>
      prev.map((r) => (r.wilaya_code === code ? { ...r, ...patch } : r))
    );
  };

  const validateRow = (row: DraftRow): string | null => {
    const homeError = validateDeliveryPrice(row.home);
    if (homeError) return `#${row.wilaya_code} — ${homeError}`;
    const officeError = validateDeliveryPrice(row.office);
    if (officeError) return `#${row.wilaya_code} — ${officeError}`;
    return null;
  };

  const saveRow = async (row: DraftRow) => {
    const error = validateRow(row);
    if (error) {
      showToast(error, true);
      return;
    }
    setSavingCode(row.wilaya_code);
    const result = await saveDeliveryZoneAction({
      wilaya_code: row.wilaya_code,
      home_price: parseDeliveryPrice(row.home) as number,
      office_price: parseDeliveryPrice(row.office) as number,
      is_active: row.is_active,
    });
    setSavingCode(null);
    showToast(
      result.ok
        ? formatAr(ar.delivery.savedWilaya, { code: row.wilaya_code })
        : result.error ?? ar.delivery.couldNotSave,
      !result.ok
    );
  };

  const saveAll = async () => {
    for (const row of rows) {
      const error = validateRow(row);
      if (error) {
        showToast(error, true);
        return;
      }
    }
    setSavingAll(true);
    const result = await saveAllDeliveryZonesAction(
      rows.map((row) => ({
        wilaya_code: row.wilaya_code,
        home_price: parseDeliveryPrice(row.home) as number,
        office_price: parseDeliveryPrice(row.office) as number,
        is_active: row.is_active,
      }))
    );
    setSavingAll(false);
    showToast(
      result.ok ? ar.delivery.savedAll : result.error ?? ar.delivery.couldNotSave,
      !result.ok
    );
  };

  const bulkSet = async (field: "home" | "office") => {
    const error = validateDeliveryPrice(bulkPrice);
    if (error) {
      showToast(error, true);
      return;
    }
    const parsed = parseDeliveryPrice(bulkPrice) as number;
    setBulking(field);
    const result = await bulkSetDeliveryPricesAction(field, parsed);
    setBulking(null);
    if (!result.ok) {
      showToast(result.error ?? ar.delivery.couldNotSave, true);
      return;
    }
    setRows((prev) =>
      prev.map((row) =>
        field === "home"
          ? { ...row, home: String(parsed) }
          : { ...row, office: String(parsed) }
      )
    );
    showToast(
      formatAr(
        field === "home" ? ar.delivery.bulkSetHome : ar.delivery.bulkSetOffice,
        { price: parsed }
      )
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 bg-white border border-black/10 rounded-lg p-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium mb-1" htmlFor="zone-search">
            {ar.delivery.search}
          </label>
          <input
            id="zone-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={ar.delivery.searchPlaceholder}
            className="w-full px-3 py-2 border border-black/15 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" htmlFor="bulk-price">
            {ar.delivery.bulkPrice}
          </label>
          <input
            id="bulk-price"
            type="number"
            min={0}
            max={100000}
            step="0.01"
            value={bulkPrice}
            onChange={(e) => setBulkPrice(e.target.value)}
            className="w-32 px-3 py-2 border border-black/15 rounded-lg text-sm"
          />
        </div>
        <button
          type="button"
          onClick={() => bulkSet("home")}
          disabled={bulking !== null}
          className="px-3 py-2 rounded-lg border border-black/15 text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
        >
          {bulking === "home" ? ar.common.saving : ar.delivery.setAllHome}
        </button>
        <button
          type="button"
          onClick={() => bulkSet("office")}
          disabled={bulking !== null}
          className="px-3 py-2 rounded-lg border border-black/15 text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
        >
          {bulking === "office" ? ar.common.saving : ar.delivery.setAllOffice}
        </button>
        <button
          type="button"
          onClick={saveAll}
          disabled={savingAll || savingCode !== null}
          className="px-4 py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-black/80 disabled:opacity-50"
        >
          {savingAll ? ar.common.saving : ar.delivery.saveAll}
        </button>
      </div>

      <div className="bg-white border border-black/10 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 text-start text-black/60">
              <th className="px-3 py-3 font-medium text-start">#</th>
              <th className="px-3 py-3 font-medium text-start">
                {ar.orders.wilaya}
              </th>
              <th className="px-3 py-3 font-medium text-start">
                {ar.delivery.homePrice}
              </th>
              <th className="px-3 py-3 font-medium text-start">
                {ar.delivery.officePrice}
              </th>
              <th className="px-3 py-3 font-medium text-start">
                {ar.delivery.active}
              </th>
              <th className="px-3 py-3 font-medium text-start">
                {ar.delivery.save}
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr
                key={row.wilaya_code}
                className="border-b border-black/5 hover:bg-gray-50"
              >
                <td className="px-3 py-2 text-black/50">
                  {String(row.wilaya_code).padStart(2, "0")}
                </td>
                <td className="px-3 py-2">
                  <span className="font-medium">{row.name_fr}</span>
                  <span className="text-black/50"> — {row.name_ar}</span>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min={0}
                    max={100000}
                    step="0.01"
                    value={row.home}
                    onChange={(e) =>
                      updateRow(row.wilaya_code, { home: e.target.value })
                    }
                    aria-label={`${ar.delivery.homePrice} ${row.wilaya_code}`}
                    className={cn(
                      "w-28 px-2 py-1.5 border rounded-lg text-sm",
                      validateDeliveryPrice(row.home)
                        ? "border-red-400"
                        : "border-black/15"
                    )}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min={0}
                    max={100000}
                    step="0.01"
                    value={row.office}
                    onChange={(e) =>
                      updateRow(row.wilaya_code, { office: e.target.value })
                    }
                    aria-label={`${ar.delivery.officePrice} ${row.wilaya_code}`}
                    className={cn(
                      "w-28 px-2 py-1.5 border rounded-lg text-sm",
                      validateDeliveryPrice(row.office)
                        ? "border-red-400"
                        : "border-black/15"
                    )}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={row.is_active}
                    onChange={(e) =>
                      updateRow(row.wilaya_code, { is_active: e.target.checked })
                    }
                    aria-label={`${ar.delivery.active} ${row.wilaya_code}`}
                  />
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => saveRow(row)}
                    disabled={savingCode === row.wilaya_code}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-black text-white hover:bg-black/80 disabled:opacity-50"
                  >
                    {savingCode === row.wilaya_code
                      ? ar.common.saving
                      : ar.common.save}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-black/50">
                  {ar.delivery.noMatch}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {toast && (
        <div
          role="status"
          className={cn(
            "fixed bottom-5 end-5 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium",
            toast.error ? "bg-red-600 text-white" : "bg-emerald-600 text-white"
          )}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
