import { describe, expect, it } from "vitest";
import { getAdminAccessDecision } from "./access";

describe("getAdminAccessDecision", () => {
  it("allows an unauthenticated visit to /admin/login", () => {
    const decision = getAdminAccessDecision({
      pathname: "/admin/login",
      isAuthenticated: false,
    });
    expect(decision).toEqual({ action: "allow" });
  });

  it("redirects a signed-in admin away from /admin/login to /admin", () => {
    const decision = getAdminAccessDecision({
      pathname: "/admin/login",
      isAuthenticated: true,
      isAdmin: true,
    });
    expect(decision).toEqual({
      action: "redirect",
      destination: "/admin",
      reason: "already-admin",
    });
  });

  it("keeps a signed-in non-admin on /admin/login so the denial message stays visible", () => {
    const decision = getAdminAccessDecision({
      pathname: "/admin/login",
      isAuthenticated: true,
      isAdmin: false,
    });
    expect(decision).toEqual({ action: "allow" });
  });

  it("redirects an unauthenticated request to protected admin pages back to login", () => {
    for (const pathname of [
      "/admin",
      "/admin/orders",
      "/admin/products",
      "/admin/products/abc/edit",
      "/admin/reviews",
    ]) {
      const decision = getAdminAccessDecision({
        pathname,
        isAuthenticated: false,
      });
      expect(decision).toEqual({
        action: "redirect",
        destination: "/admin/login",
        reason: "unauthenticated",
      });
    }
  });

  it("allows an authenticated admin on protected pages", () => {
    const decision = getAdminAccessDecision({
      pathname: "/admin/products",
      isAuthenticated: true,
      isAdmin: true,
    });
    expect(decision).toEqual({ action: "allow" });
  });

  it("allows an authenticated non-admin on protected pages (membership enforced by requireAdmin)", () => {
    const decision = getAdminAccessDecision({
      pathname: "/admin/orders",
      isAuthenticated: true,
      isAdmin: false,
    });
    expect(decision).toEqual({ action: "allow" });
  });
});
