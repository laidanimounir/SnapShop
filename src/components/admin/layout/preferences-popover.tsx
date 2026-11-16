"use client";

import { ChevronDown, Settings } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { Button } from "@/components/admin/ui/button";
import { Label } from "@/components/admin/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/admin/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/admin/ui/dropdown-menu";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/admin/ui/toggle-group";
import {
  PREFERENCE_REGISTRY,
  type PreferenceKey,
} from "@/lib/admin/preferences-config";
import { THEME_PRESET_OPTIONS } from "@/lib/admin/preferences/theme";
import { useAdminPreferencesStore } from "@/lib/admin/preferences-provider";
import { ar } from "@/lib/admin/i18n-ar";
import { cn } from "@/lib/utils";

function usePreferences() {
  return useAdminPreferencesStore(
    useShallow((state) => ({
      values: state.values,
      resolvedThemeMode: state.resolvedThemeMode,
      setPreference: state.setPreference,
      resetPreferences: state.resetPreferences,
    })),
  );
}

function isPresetActive(preset: string, values: any) {
  return values.theme_preset === preset;
}

function presetLabel(preset: string) {
  const found = THEME_PRESET_OPTIONS.find((p) => p.value === preset);
  return found ? found.label : preset;
}

export function PreferencesPopover() {
  const { values, resolvedThemeMode, setPreference, resetPreferences } =
    usePreferences();

  const {
    theme_mode: themeMode,
    theme_preset: themePreset,
    content_layout: contentLayout,
    navbar_style: navbarStyle,
    sidebar_variant: variant,
    sidebar_collapsible: collapsible,
  } = values;

  const setPref = (key: PreferenceKey, value: string) => {
    setPreference(key as PreferenceKey, value as any);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="icon" aria-label={ar.nav.settings} title={ar.nav.settings}>
          <Settings />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="flex flex-col gap-5 p-3">
          <div className="space-y-1.5">
            <h4 className="text-sm leading-none font-medium text-admin-foreground">
              {ar.preferences.title}
            </h4>
            <p className="text-muted-foreground text-xs">
              {ar.preferences.subtitle}
            </p>
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-admin-foreground">
                {ar.preferences.themePreset}
              </Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-between text-xs">
                    <span>
                      {isPresetActive(themePreset, values)
                        ? presetLabel(themePreset)
                        : ar.preferences.preset}
                    </span>
                    <ChevronDown className="size-3 shrink-0 text-admin-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {THEME_PRESET_OPTIONS.map((preset) => (
                    <DropdownMenuItem
                      key={preset.value}
                      className={cn(
                        "text-xs",
                        themePreset === preset.value
                          ? "bg-admin-accent text-admin-accent-foreground"
                          : ""
                      )}
                      onClick={() => setPref("theme_preset", preset.value)}
                    >
                      <span
                        className="size-2.5 rounded-full mr-2"
                        style={{
                          backgroundColor:
                            resolvedThemeMode === "dark"
                              ? preset.primary.dark
                              : preset.primary.light,
                        }}
                      />
                      {preset.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-admin-foreground">
                {ar.preferences.themeMode}
              </Label>
              <ToggleGroup>
                <ToggleGroupItem value="light" active={themeMode === "light"} onPress={() => setPref("theme_mode", "light")}>
                  {ar.preferences.light}
                </ToggleGroupItem>
                <ToggleGroupItem value="dark" active={themeMode === "dark"} onPress={() => setPref("theme_mode", "dark")}>
                  {ar.preferences.dark}
                </ToggleGroupItem>
                <ToggleGroupItem value="system" active={themeMode === "system"} onPress={() => setPref("theme_mode", "system")}>
                  {ar.preferences.system}
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-admin-foreground">
                {ar.preferences.pageLayout}
              </Label>
              <ToggleGroup>
                <ToggleGroupItem
                  active={contentLayout === "centered"}
                  onPress={() => setPref("content_layout", "centered")}
                >
                  {ar.preferences.centered}
                </ToggleGroupItem>
                <ToggleGroupItem
                  active={contentLayout === "full-width"}
                  onPress={() => setPref("content_layout", "full-width")}
                >
                  {ar.preferences.fullWidth}
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-admin-foreground">
                {ar.preferences.navbarStyle}
              </Label>
              <ToggleGroup>
                <ToggleGroupItem
                  active={navbarStyle === "sticky"}
                  onPress={() => setPref("navbar_style", "sticky")}
                >
                  {ar.preferences.sticky}
                </ToggleGroupItem>
                <ToggleGroupItem
                  active={navbarStyle === "scroll"}
                  onPress={() => setPref("navbar_style", "scroll")}
                >
                  {ar.preferences.scroll}
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-admin-foreground">
                {ar.preferences.sidebarStyle}
              </Label>
              <ToggleGroup>
                <ToggleGroupItem
                  active={variant === "inset"}
                  onPress={() => setPref("sidebar_variant", "inset")}
                >
                  {ar.preferences.inset}
                </ToggleGroupItem>
                <ToggleGroupItem
                  active={variant === "sidebar"}
                  onPress={() => setPref("sidebar_variant", "sidebar")}
                >
                  {ar.preferences.sidebar}
                </ToggleGroupItem>
                <ToggleGroupItem
                  active={variant === "floating"}
                  onPress={() => setPref("sidebar_variant", "floating")}
                >
                  {ar.preferences.floating}
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-admin-foreground">
                {ar.preferences.sidebarCollapseMode}
              </Label>
              <ToggleGroup>
                <ToggleGroupItem
                  active={collapsible === "icon"}
                  onPress={() => setPref("sidebar_collapsible", "icon")}
                >
                  {ar.preferences.icon}
                </ToggleGroupItem>
                <ToggleGroupItem
                  active={collapsible === "offcanvas"}
                  onPress={() => setPref("sidebar_collapsible", "offcanvas")}
                >
                  {ar.preferences.offcanvas}
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full text-xs"
              onClick={resetPreferences}
            >
              {ar.preferences.restoreDefaults}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
