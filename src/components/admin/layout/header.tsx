"use client";

import { Menu, PanelLeft, Search } from "lucide-react";

import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Separator } from "@/components/admin/ui/separator";
import { AdminLogo } from "./admin-logo";
import { NavUser } from "./nav-user";
import { ThemeToggle, type AdminTheme } from "./theme-toggle";
import { useAdminShell } from "./admin-shell";

export function AdminHeader({
  email,
  theme,
}: {
  email: string;
  theme: AdminTheme;
}) {
  const { toggle, setMobileOpen } = useAdminShell();

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-admin-border bg-admin-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-admin-background/80 print:hidden">
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

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="hidden lg:inline-flex"
        onClick={toggle}
        aria-label="تبديل الشريط الجانبي"
        title="تبديل الشريط الجانبي"
      >
        <PanelLeft className="size-5" />
      </Button>

      <Separator
        orientation="vertical"
        className="mx-1 hidden h-4 self-center lg:block"
      />

      <div className="lg:hidden">
        <AdminLogo />
      </div>

      <form
        action="/admin/orders"
        method="get"
        role="search"
        className="relative ms-1 hidden sm:block"
      >
        <Search className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-admin-muted-foreground" />
        <Input
          type="search"
          name="q"
          placeholder="ابحث عن طلب..."
          aria-label="ابحث عن طلب"
          className="h-8 w-48 rounded-none ps-8 lg:w-64"
        />
      </form>

      <div className="ms-auto flex items-center gap-1">
        <ThemeToggle initialTheme={theme} />
        <NavUser email={email} compact />
      </div>
    </header>
  );
}
