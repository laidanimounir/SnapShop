"use client";

import { createContext, use } from "react";
import { useStore as useZustandStore, type StoreApi } from "zustand";

import { createAdminPreferencesStore, type AdminPreferencesState } from "@/lib/admin/preferences-store";

const PreferencesStoreContext = createContext<StoreApi<AdminPreferencesState> | null>(null);

export function PreferencesStoreProvider({
  children,
  store,
}: {
  children: React.ReactNode;
  store: ReturnType<typeof createAdminPreferencesStore>;
}) {
  return (
    <PreferencesStoreContext.Provider value={store}>
      {children}
    </PreferencesStoreContext.Provider>
  );
}

export function useAdminPreferencesStore<T>(
  selector: (state: AdminPreferencesState) => T,
): T {
  const store = use(PreferencesStoreContext) as StoreApi<AdminPreferencesState> | null;
  if (!store) throw new Error("Missing PreferencesStoreProvider");
  return useZustandStore(store, selector);
}
