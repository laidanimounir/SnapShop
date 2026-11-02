import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  adminNavGroups,
  isAdminNavItemActive,
} from "@/components/admin/layout/nav-config";

describe("admin navigation", () => {
  it("keeps the dashboard item exact so it does not match every admin route", () => {
    const dashboard = adminNavGroups[0].items[0];

    expect(isAdminNavItemActive("/admin", dashboard)).toBe(true);
    expect(isAdminNavItemActive("/admin/orders", dashboard)).toBe(false);
    expect(isAdminNavItemActive("/admin/settings", dashboard)).toBe(false);
  });

  it("matches nested routes without matching similar prefixes", () => {
    const orders = adminNavGroups
      .flatMap((group) => group.items)
      .find((item) => item.href === "/admin/orders");

    expect(orders).toBeDefined();
    expect(isAdminNavItemActive("/admin/orders", orders!)).toBe(true);
    expect(isAdminNavItemActive("/admin/orders/123", orders!)).toBe(true);
    expect(isAdminNavItemActive("/admin/orders-archive", orders!)).toBe(false);
  });

  it("exposes every existing admin section exactly once", () => {
    const hrefs = adminNavGroups.flatMap((group) =>
      group.items.map((item) => item.href)
    );

    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(hrefs).toEqual(
      expect.arrayContaining([
        "/admin",
        "/admin/orders",
        "/admin/products",
        "/admin/landing-pages",
        "/admin/landing-templates",
        "/admin/delivery",
        "/admin/reviews",
        "/admin/settings",
      ])
    );
    expect(hrefs.every((href) => href.startsWith("/admin"))).toBe(true);
  });
});

describe("admin theme scoping", () => {
  it("scopes dark tokens to the admin root and its portals", () => {
    const css = readFileSync(
      new URL("../../../styles/admin.css", import.meta.url),
      "utf8"
    );

    expect(css).toContain('.admin-root[data-theme="dark"]');
    expect(css).toContain(':root:has(.admin-root[data-theme="dark"])');
    expect(css).not.toMatch(/(^|\n)\.dark\s*\{/);
  });
});
