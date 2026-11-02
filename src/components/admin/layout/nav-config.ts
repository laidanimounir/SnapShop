import {
  Files,
  LayoutDashboard,
  LayoutTemplate,
  Package,
  Settings,
  ShoppingCart,
  Star,
  Truck,
  type LucideIcon,
} from "lucide-react";

import { ar } from "@/lib/admin/i18n-ar";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

export interface AdminNavGroup {
  label: string;
  items: AdminNavItem[];
}

export const adminNavGroups: AdminNavGroup[] = [
  {
    label: "الرئيسية",
    items: [
      {
        href: "/admin",
        label: ar.nav.dashboard,
        icon: LayoutDashboard,
        exact: true,
      },
    ],
  },
  {
    label: "المتجر",
    items: [
      { href: "/admin/orders", label: ar.nav.orders, icon: ShoppingCart },
      { href: "/admin/products", label: ar.nav.products, icon: Package },
      { href: "/admin/delivery", label: ar.nav.delivery, icon: Truck },
      { href: "/admin/reviews", label: ar.nav.reviews, icon: Star },
    ],
  },
  {
    label: "المحتوى",
    items: [
      {
        href: "/admin/landing-pages",
        label: ar.landing.title,
        icon: LayoutTemplate,
      },
      {
        href: "/admin/landing-templates",
        label: ar.nav.templates,
        icon: Files,
      },
    ],
  },
  {
    label: "النظام",
    items: [
      { href: "/admin/settings", label: ar.nav.settings, icon: Settings },
    ],
  },
];

export function isAdminNavItemActive(
  pathname: string,
  item: AdminNavItem
): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
