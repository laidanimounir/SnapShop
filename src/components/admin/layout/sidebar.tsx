"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelRightClose } from "lucide-react";

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

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <nav
        aria-label="التنقل الرئيسي"
        className="flex-1 overflow-x-hidden overflow-y-auto px-2 py-3"
      >
        {adminNavGroups.map((group, groupIndex) => (
          <div key={group.label} className="pb-1">
            {groupIndex > 0 &&
              (collapsed ? (
                <div className="mx-2 my-2 h-px bg-admin-sidebar-border" />
              ) : (
                <p className="px-2 pb-1 pt-3 text-[10px] font-medium tracking-wide text-admin-muted-foreground">
                  {group.label}
                </p>
              ))}
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active = isAdminNavItemActive(pathname, item);
                const Icon = item.icon;
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex h-9 items-center gap-2.5 rounded-none text-xs font-medium transition-colors",
                          "text-admin-sidebar-foreground/80 hover:bg-admin-sidebar-accent hover:text-admin-sidebar-accent-foreground",
                          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-admin-ring",
                          active &&
                            "bg-admin-sidebar-accent text-admin-sidebar-accent-foreground",
                          collapsed
                            ? "justify-center px-0"
                            : "px-2.5"
                        )}
                      >
                        <Icon className="size-4 shrink-0" />
                        {!collapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </Link>
                    </TooltipTrigger>
                    {collapsed && (
                      <TooltipContent side="left">{item.label}</TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-admin-sidebar-border p-2">
        <NavUser email={email} compact={collapsed} />
      </div>
    </div>
  );
}

export function AdminSidebar({ email }: { email: string }) {
  const { open, toggle, mobileOpen, setMobileOpen } = useAdminShell();
  const [previewOpen, setPreviewOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
    setPreviewOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        onMouseEnter={() => {
          if (!open) setPreviewOpen(true);
        }}
        className={cn(
          "sticky top-0 z-30 hidden h-svh shrink-0 flex-col border-e border-admin-sidebar-border bg-admin-sidebar text-admin-sidebar-foreground transition-[width] duration-200 lg:flex print:hidden",
          open ? "w-64" : "w-12"
        )}
      >
        <div
          className={cn(
            "flex h-14 shrink-0 items-center border-b border-admin-sidebar-border px-2",
            open ? "justify-between" : "justify-center"
          )}
        >
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
      </aside>

      {!open && previewOpen && (
        <div
          onMouseLeave={() => setPreviewOpen(false)}
          className="fixed inset-y-0 right-0 z-50 hidden w-64 flex-col border-e border-admin-sidebar-border bg-admin-sidebar text-admin-sidebar-foreground shadow-xl lg:flex print:hidden"
        >
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-admin-sidebar-border px-2">
            <AdminLogo />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setPreviewOpen(false)}
              aria-label={ar.nav.collapseSidebar}
              title={ar.nav.collapseSidebar}
            >
              <PanelRightClose className="size-4" />
            </Button>
          </div>
          <SidebarContent
            collapsed={false}
            email={email}
            onNavigate={() => setPreviewOpen(false)}
          />
        </div>
      )}

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-[18rem] gap-0 p-0 sm:max-w-[18rem]"
        >
          <SheetTitle className="sr-only">القائمة</SheetTitle>
          <SheetDescription className="sr-only">
            التنقل بين أقسام لوحة التحكم
          </SheetDescription>
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-admin-sidebar-border bg-admin-sidebar px-3">
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
            <SidebarContent
              collapsed={false}
              email={email}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  );
}
