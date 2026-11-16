"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { ArrowRight, Menu, PanelLeft, Search, Store } from "lucide-react";

import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Separator } from "@/components/admin/ui/separator";
import { AdminLogo } from "./admin-logo";
import { NavUser } from "./nav-user";
import { ThemeToggle, type AdminTheme } from "./theme-toggle";
import { useAdminShell } from "./admin-shell";
import { ar } from "@/lib/admin/i18n-ar";
import { cn } from "@/lib/utils";
import { adminNavGroups } from "./nav-config";

export function AdminHeader({
  email,
  theme,
}: {
  email: string;
  theme: AdminTheme;
}) {
  const { toggle, setMobileOpen } = useAdminShell();
  const pathname = usePathname();
  const searchRef = useRef<HTMLInputElement>(null);

  // Ctrl+K to focus search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const currentLabel = adminNavGroups
    .flatMap((group) => group.items)
    .find((item) => item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`))
    ?.label;

  return (
    <header className="sticky top-0 z-20 h-12 shrink-0 items-center gap-2 border-b border-admin-border bg-admin-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-admin-background/80 print:hidden">
      {/* Mobile menu trigger */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="فتح القائمة"
        title="فتح القائمة"
      >
        <Menu className="size-5" />
      </Button>

      {/* Desktop sidebar toggle */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="hidden lg:inline-flex -rotate-180"
        onClick={toggle}
        aria-label={ar.nav.collapseSidebar}
        title={ar.nav.collapseSidebar}
      >
        <PanelLeft className="size-5" />
      </Button>

      <Separator orientation="vertical" className="mx-1 hidden h-4 self-center lg:block" />

      {/* Search trigger (Ctrl+K) */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => searchRef.current?.focus()}
        aria-label={ar.header.search}
        title={ar.header.search}
      >
        <Search className="size-4" />
        <kbd className="ml-1 hidden sm:inline-flex size-5 items-center gap-1 rounded border border-admin-border px-1.5 text-[10px] font-medium text-admin-muted-foreground">
          <span className="text-xs">⌃</span>K
        </kbd>
      </Button>

      {/* Inline order search (existing behavior preserved) */}
      <form
        action="/admin/orders"
        method="get"
        role="search"
        className="relative hidden sm:flex items-center border border-admin-border rounded-lg bg-admin-background px-2 py-1 focus-within:ring-1 focus-within:ring-admin-ring"
      >
        <Search
          className="pointer-events-none absolute start-2 top-1/2 size-3.5 -translate-y-1/2 text-admin-muted-foreground"
        />
        <Input
          ref={searchRef}
          type="search"
          name="q"
          placeholder={ar.header.searchPlaceholder}
          aria-label={ar.header.search}
          className="h-8 w-48 rounded-none ps-8 lg:w-64 bg-transparent focus:ring-0"
        />
      </form>

      {/* Breadcrumb / page title */}
      {currentLabel && (
        <Link
          href="/admin"
          className={cn(
            "hidden lg:block flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-admin-muted-foreground hover:bg-admin-muted hover:text-admin-foreground transition-colors",
            pathname === "/admin" ? "bg-admin-muted text-admin-foreground" : ""
          )}
        >
          <span className="text-[10px] text-admin-muted-foreground">لوحة التحكم</span>
          <span className="text-admin-foreground">{currentLabel}</span>
        </Link>
      )}

      <div className="flex items-center gap-1 ms-auto">
        {/* View store link */}
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-admin-muted-foreground hover:bg-admin-muted hover:text-admin-foreground transition-colors"
          )}
        >
          <Store className="size-3.5 text-admin-muted-foreground" />
          <span>{ar.header.viewStore}</span>
        </Link>

        <ThemeToggle initialTheme={theme} />
        <NavUser email={email} compact />
      </div>
    </header>
  );
}
