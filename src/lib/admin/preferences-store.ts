"use client";

import { createStore } from "zustand/vanilla";

import {
  PREFERENCE_DEFAULTS,
  PREFERENCE_KEYS,
  PREFERENCE_REGISTRY,
  type PreferenceKey,
  type PreferenceValueMap,
  parsePreference,
} from "@/lib/admin/preferences-config";
import type { ResolvedThemeMode } from "@/lib/admin/preferences/theme";

export type AdminPreferencesState = {
  values: PreferenceValueMap;
  resolvedThemeMode: ResolvedThemeMode;
  isSynced: boolean;
  setPreference: <K extends PreferenceKey>(key: K, value: PreferenceValueMap[K]) => void;
  resetPreferences: () => void;
};

export const createAdminPreferencesStore = (
  initialValues: Partial<PreferenceValueMap> = {},
) => {
  const values: PreferenceValueMap = {
    ...PREFERENCE_DEFAULTS,
    ...initialValues,
  };

  return createStore<AdminPreferencesState>()((set) => ({
    values,
    resolvedThemeMode: values.theme_mode === "dark" ? "dark" : "light",
    isSynced: false,

    setPreference: (key, value) => {
      const resolvedThemeMode =
        key === "theme_mode" ? (value === "dark" ? "dark" : "light") : undefined;

      set((state) => ({
        values: {
          ...state.values,
          [key]: value,
        } as PreferenceValueMap,
        ...(resolvedThemeMode ? { resolvedThemeMode } : {}),
      }));

      void persistPreference(key, value);
    },

    resetPreferences: () => {
      let resolvedThemeMode: ResolvedThemeMode = "light";

      for (const key of PREFERENCE_KEYS) {
        const value = PREFERENCE_DEFAULTS[key];
        if (key === "theme_mode") resolvedThemeMode = value === "dark" ? "dark" : "light";
        void persistPreference(key, value);
      }

      set({
        values: { ...PREFERENCE_DEFAULTS },
        resolvedThemeMode,
      });
    },
  }));
};

function persistPreference(key: PreferenceKey, value: string) {
  if (typeof document === "undefined") return;
  document.cookie = `admin_pref_${key}=${value}; path=/; max-age=31536000; samesite=lax`;
}
