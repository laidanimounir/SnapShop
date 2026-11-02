"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/admin/ui/button";

export type AdminTheme = "light" | "dark";

const THEME_COOKIE = "admin_theme";

export function ThemeToggle({ initialTheme }: { initialTheme: AdminTheme }) {
  const [theme, setTheme] = useState<AdminTheme>(initialTheme);

  useEffect(() => {
    setTheme(initialTheme);
  }, [initialTheme]);

  const toggle = () => {
    const next: AdminTheme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document
      .querySelectorAll(".admin-root")
      .forEach((root) => root.setAttribute("data-theme", next));
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
  };

  const label = theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={label}
      title={label}
    >
      {theme === "dark" ? (
        <Sun className="size-4" />
      ) : (
        <Moon className="size-4" />
      )}
    </Button>
  );
}
