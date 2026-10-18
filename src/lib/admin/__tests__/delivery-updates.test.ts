import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildDeliveryZoneUpdates } from "../delivery-updates";

describe("buildDeliveryZoneUpdates", () => {
  const row = {
    wilaya_code: 16,
    home_price: 600,
    office_price: 400,
    is_active: true,
  };

  it("maps values and stamps updated_at", () => {
    const [built] = buildDeliveryZoneUpdates([row], "2026-01-01T00:00:00.000Z");
    expect(built).toEqual({
      wilaya_code: 16,
      home_price: 600,
      office_price: 400,
      is_active: true,
      updated_at: "2026-01-01T00:00:00.000Z",
    });
  });

  it("uses a fresh ISO timestamp by default", () => {
    const [built] = buildDeliveryZoneUpdates([row]);
    expect(Number.isNaN(Date.parse(built.updated_at))).toBe(false);
  });

  it("never includes the NOT NULL name columns", () => {
    const [built] = buildDeliveryZoneUpdates([row], "2026-01-01T00:00:00.000Z");
    expect(Object.keys(built).sort()).toEqual(
      ["home_price", "is_active", "office_price", "updated_at", "wilaya_code"].sort()
    );
    expect(built).not.toHaveProperty("name_ar");
    expect(built).not.toHaveProperty("name_fr");
  });

  it("handles empty input", () => {
    expect(buildDeliveryZoneUpdates([])).toEqual([]);
  });
});

describe("updateDeliveryZones data layer", () => {
  const source = readFileSync(
    fileURLToPath(new URL("../../api/admin.ts", import.meta.url)),
    "utf8"
  );

  it("never uses upsert for delivery zones (the 23502 regression)", () => {
    expect(source).not.toContain(".upsert(");
    expect(source).not.toContain("onConflict");
  });

  it("updates rows by wilaya_code", () => {
    expect(source).toContain('.from("delivery_zones")');
    expect(source).toContain('.eq("wilaya_code"');
  });
});
