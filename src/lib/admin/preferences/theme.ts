export const THEME_MODE_OPTIONS = [
  { label: "فاتح", value: "light" },
  { label: "داكن", value: "dark" },
  { label: "النظام", value: "system" },
] as const;

export const THEME_MODE_VALUES = THEME_MODE_OPTIONS.map((o) => o.value);
export type ThemeMode = (typeof THEME_MODE_VALUES)[number];
export type ResolvedThemeMode = "light" | "dark";

export const THEME_PRESET_OPTIONS = [
  {
    label: "افتراضي",
    value: "default",
    primary: { light: "hsl(var(--admin-primary))", dark: "hsl(var(--admin-primary))" },
  },
  {
    label: "بروتاليست",
    value: "brutalist",
    primary: { light: "hsl(0 0% 30%)", dark: "hsl(0 0% 80%)" },
  },
  {
    label: "سافت بوب",
    value: "soft-pop",
    primary: { light: "hsl(277 50% 55%)", dark: "hsl(277 40% 70%)" },
  },
  {
    label: "تنجيرين",
    value: "tangerine",
    primary: { light: "hsl(36 70% 55%)", dark: "hsl(36 70% 55%)" },
  },
] as const;

export const THEME_PRESET_VALUES = THEME_PRESET_OPTIONS.map((p) => p.value);

export type ThemePreset = (typeof THEME_PRESET_OPTIONS)[number]["value"];
