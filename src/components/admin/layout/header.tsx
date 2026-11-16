"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Monitor, Sun } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { Button } from "@/components/admin/ui/button";
import { Separator } from "@/components/admin/ui/separator";
import { NavUser } from "./nav-user";
import { PreferencesPopover } from "./preferences-popover";
import { SearchDialog } from "./search-dialog";
import { useAdminShell } from "./admin-shell";
import { useAdminPreferencesStore } from "@/lib/admin/preferences-provider";
import { ar } from "@/lib/admin/i18n-ar";
import { cn } from "@/lib/utils";
import { adminNavGroups } from "./nav-config";

export function AdminHeader({
  email,
  theme,
}: {
  email: string;
  theme: "light" | "dark";
}) {
  const { toggle, setMobileOpen } = useAdminShell();
  const { theme_mode: themeMode, setPreference } = useAdminPreferencesStore(
    useShallow((state) => ({
      theme_mode: state.values.theme_mode,
      setPreference: state.setPreference,
    })),
  );
  const pathname = usePathname();

  const cycleTheme = () => {
    const next =
      themeMode === "light" ? "dark" : themeMode === "dark" ? "system" : "light";
    setPreference("theme_mode", next);
  };

  const currentLabel = adminNavGroups
    .flatMap((group) => group.items)
    .find((item) => item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`))
    ?.label;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 shrink-0 items-center justify-between border-b border-white/[0.08] bg-admin-background/80 backdrop-blur-md px-4 lg:px-6 print:hidden",
        theme === "dark" ? "bg-admin-background/90" : "",
        "h-[4.5rem] min-h-[4.5rem]"
      )}
    >

      {/* Left: mobile menu + sidebar toggle + search + theme */}
      <div className="flex shrink-0 items-center gap-2">
        <SearchDialog />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden shrink-0"
          onClick={() => setMobileOpen(true)}
          aria-label="فتح القائمة"
          title="فتح القائمة"
        >
          <span className="sr-only">فتح القائمة</span>
          <svg
            className="size-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16m-7 6h7"
            />
          </svg>
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="hidden md:flex shrink-0 -rotate-180"
          onClick={toggle}
          aria-label={ar.nav.collapseSidebar}
          title={ar.nav.collapseSidebar}
        >
          <span className="sr-only">{ar.nav.collapseSidebar}</span>
          <svg
            className="size-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16m-7 6h7"
            />
          </svg>
        </Button>

        <Separator
          orientation="vertical"
          className="mx-1 shrink-0 hidden h-4 self-center md:block"
        />

        <PreferencesPopover />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={cycleTheme}
          aria-label={themeMode === "light" ? "التبديل للوضع الداكن" : themeMode === "dark" ? "التبديل للنظام" : "التبديل للوضع الفاتح"}
          title={themeMode === "light" ? "الوضع الداكن" : themeMode === "dark" ? "النظام" : "الوضع الفاتح"}
        >
          {themeMode === "system" ? (
            <Monitor className="size-4" />
          ) : themeMode === "dark" ? (
            <Sun className="size-4" />
          ) : (
            <Moon className="size-4" />
          )}
        </Button>
      </div>

      {/* Center: breadcrumb */}
      <div className="flex shrink-0 items-center justify-center gap-2">
        {currentLabel && (
          <Link
            href="/admin"
            className={cn(
              "hidden md:block flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-admin-muted-foreground hover:bg-admin-muted hover:text-admin-foreground transition-colors",
              pathname === "/admin"
                ? "bg-admin-muted text-admin-foreground"
                : ""
            )}
          >
            <span className="text-admin-foreground">{currentLabel}</span>
          </Link>
        )}
      </div>

      {/* Right: view store + user */}
      <div className="flex shrink-0 items-center justify-end gap-1 ms-auto">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-admin-muted-foreground hover:bg-admin-muted hover:text-admin-foreground transition-colors"
          )}
        >
          <svg
            className="size-3.5 text-admin-muted-foreground"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3v2h18V3H3v20h18v-2H3z"
            />
          </svg>
          <span>{ar.header.viewStore}</span>
        </Link>

        <NavUser email={email} compact />
      </div>
    </header>
  );
}
