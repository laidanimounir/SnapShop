"use client";

import { useEffect, useState } from "react";

import { createAdminPreferencesStore, type AdminPreferencesState } from "@/lib/admin/preferences-store";
import { PreferencesStoreProvider } from "@/lib/admin/preferences-provider";
import type { PreferenceValueMap } from "@/lib/admin/preferences-config";

export function PreferencesProvider({
  children,
  initialValues,
}: {
  children: React.ReactNode;
  initialValues: Partial<PreferenceValueMap>;
}) {
  const [store] = useState<ReturnType<typeof createAdminPreferencesStore>>(() =>
    createAdminPreferencesStore(initialValues),
  );

  // Resolve "system" theme mode on the client and keep the `dark` class and
  // `data-theme` attribute in sync so Tailwind `dark:` variants and the
  // `--admin-*` tokens stay consistent without a flash.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.querySelector(".admin-root");
    if (!root) return;

    const updateResolvedTheme = () => {
      const mode = store.getState().values.theme_mode;
      let resolved: "light" | "dark" = "dark";
      if (mode === "light") resolved = "light";
      else if (mode === "dark") resolved = "dark";
      else if (mode === "system") {
        resolved = window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      }

      if (resolved === "dark") {
        root.classList.add("dark");
        root.setAttribute("data-theme", "dark");
      } else {
        root.classList.remove("dark");
        root.setAttribute("data-theme", "light");
      }
    };

    updateResolvedTheme();

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", updateResolvedTheme);
    const unsub = store.subscribe(updateResolvedTheme);

    return () => {
      mq.removeEventListener("change", updateResolvedTheme);
      unsub();
    };
  }, [store]);

  return (
    <PreferencesStoreProvider store={store}>
      {children}
    </PreferencesStoreProvider>
  );
}
