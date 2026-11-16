"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelRightClose } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { Fragment } from "react";

import { ar } from "@/lib/admin/i18n-ar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/admin/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/admin/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/admin/ui/tooltip";
import { AdminLogo } from "./admin-logo";
import { NavUser } from "./nav-user";
import { adminNavGroups, isAdminNavItemActive } from "./nav-config";
import { useAdminShell } from "./admin-shell";
import { useAdminPreferencesStore } from "@/lib/admin/preferences-provider";

function SidebarContent({
  collapsed,
  email,
  onNavigate,
}: {
  collapsed: boolean;
  email: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { collapsible } = useAdminPreferencesStore(
    useShallow((state) => ({ collapsible: state.values.sidebar_collapsible })),
  );

  const showTooltips = collapsible === "icon";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <nav
        aria-label="التنقل الرئيسي"
        className="flex-1 overflow-x-hidden overflow-y-auto ps-3 pe-3 py-4"
      >
        <div className="flex flex-col gap-1.5 ps-2 pe-2">
          {/* Quick create primary action */}
          <div className="flex flex-col gap-1">
            <Link
              href="/admin/products/new"
              className="flex w-full items-center gap-2 rounded-lg bg-admin-primary px-3 py-2 text-xs font-medium text-admin-primary-foreground transition-colors hover:bg-admin-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-admin-ring"
            >
              <svg
                className="size-4 shrink-0"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              {collapsed ? "..." : ar.nav.newProduct}
            </Link>
            <Link
              href="/admin/orders"
              className="flex w-full items-center gap-2 rounded-lg border border-admin-border bg-admin-background px-3 py-2 text-xs font-medium text-admin-foreground transition-colors hover:bg-admin-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-admin-ring"
            >
              <svg
                className="size-4 shrink-0"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M3 10l1.557-3.114a1 1 0 011.443-.443l2.557 1.278c.273.136.428.42.428.73v8.686c0 .31-.155.594-.428.73L11.443 21.01a1 1 0 01-1.443-.443L3 17.886V20a1 1 0 01-1 1H1a1 1 0 01-1-1v-9a1 1 0 011-1z"
                />
              </svg>
              {collapsed ? "..." : ar.nav.orders}
            </Link>
          </div>
          <div className="h-[1px] bg-admin-sidebar-border/50 mx-3 my-3"></div>

          {adminNavGroups.map((group) => (
            <div key={group.label} className="mb-2 last:mb-0">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-admin-muted-foreground ps-1 pe-1">
                {collapsed ? "..." : group.label}
              </span>
              <div className="flex flex-col">
                {group.items.map((item) => {
                  const active = isAdminNavItemActive(pathname, item);
                  const Icon = item.icon;
                  return (
                    <Fragment key={item.href}>
                      {showTooltips ? (
                        <Tooltip key={item.href}>
                          <TooltipTrigger asChild>
                            <Link
                              href={item.href}
                              onClick={onNavigate}
                              aria-current={active ? "page" : undefined}
                              className={cn(
                                "group/menu-item flex items-center gap-2.5 rounded-lg text-sm font-medium transition-colors",
                                "my-0 ps-2.5 pe-2.5 py-1.5",
                                active
                                  ? "bg-admin-primary/10 border border-admin-primary/20 text-admin-primary font-medium"
                                  : "text-admin-sidebar-foreground hover:bg-white/[0.03] hover:text-admin-sidebar-foreground",
                                collapsed
                                  ? "justify-center"
                                  : ""
                              )}
                            >
                              <Icon className="size-4 shrink-0" />
                              {!collapsed && (
                                <span className="truncate text-start">{item.label}</span>
                              )}
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent side="left">{item.label}</TooltipContent>
                        </Tooltip>
                      ) : (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={onNavigate}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "group/menu-item flex items-center gap-2.5 rounded-lg text-sm font-medium transition-colors",
                            "my-0 ps-2.5 pe-2.5 py-1.5",
                            active
                              ? "bg-admin-primary/10 border border-admin-primary/20 text-admin-primary font-medium"
                              : "text-admin-sidebar-foreground hover:bg-white/[0.03] hover:text-admin-sidebar-foreground",
                            collapsed
                              ? "justify-center"
                              : ""
                          )}
                        >
                          <Icon className="size-4 shrink-0" />
                          {!collapsed && (
                            <span className="truncate text-start">{item.label}</span>
                          )}
                        </Link>
                      )}
                    </Fragment>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>
      <div className="border-s border-admin-sidebar-border/50 p-3">
        <NavUser email={email} compact={collapsed} />
      </div>
    </div>
  );
}

export function AdminSidebar({ email }: { email: string }) {
  const { open, toggle, mobileOpen, setMobileOpen } = useAdminShell();
  const { variant, collapsible } =
    useAdminPreferencesStore(
      useShallow((state) => ({
        variant: state.values.sidebar_variant,
        collapsible: state.values.sidebar_collapsible,
      })),
    );

  const isRight = true; // RTL: sidebar on the right

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        className={cn(
          "sticky top-0 z-30 h-svh shrink-0 flex-col border-s border-admin-sidebar-border bg-admin-sidebar text-admin-sidebar-foreground transition-[width] duration-200 lg:flex print:hidden",
          open ? "w-64" : "w-14",
          "fixed inset-y-0 right-0 z-10 md:static md:inset-y-auto md:right-auto",
          variant === "floating" ? "rounded-lg shadow-sm ring-1 ring-admin-sidebar-border p-2 m-4" : "",
          variant === "inset" ? "m-4 rounded-xl shadow-sm ring-1 ring-admin-sidebar-border" : ""
        )}
      >
        <div className="flex h-14 shrink-0 items-center border-b border-admin-sidebar-border ps-2 pe-2 justify-between">
          <AdminLogo collapsed={!open} />
          {open && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={toggle}
              aria-label={ar.nav.collapseSidebar}
              title={ar.nav.collapseSidebar}
            >
              <PanelRightClose className="size-4" />
            </Button>
          )}
        </div>
        <SidebarContent collapsed={!open} email={email} />

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="right"
            showCloseButton={false}
            className="w-[18rem] gap-0 p-0 sm:max-w-[18rem]"
          >
            <SheetTitle className="sr-only">{ar.nav.dashboard}</SheetTitle>
            <SheetDescription className="sr-only">
              التنقل بين أقسام لوحة التحكم
            </SheetDescription>
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-admin-sidebar-border bg-admin-sidebar ps-3 pe-3">
              <AdminLogo />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setMobileOpen(false)}
                aria-label="إغلاق القائمة"
                title="إغلاق القائمة"
              >
                <PanelRightClose className="size-4" />
              </Button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col bg-admin-sidebar">
              <SidebarContent collapsed={false} email={email} />
            </div>
          </SheetContent>
        </Sheet>
      </aside>
    </TooltipProvider>
  );
}
