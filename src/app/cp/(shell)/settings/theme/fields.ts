/**
 * Theme settings field catalog — the varnames stored in find_settings under grouptitle="theme".
 *
 * find_domains (the legacy Domain Details row) has no color/hex column anywhere, so there is no
 * existing "theme color" to read — this is a genuinely NEW setting, not a legacy field being
 * surfaced. It follows the exact fallback settingsRepository.ts already documents for this case
 * ("settings the legacy schema never had a varname for yet"), the same mechanism General
 * Settings already uses for its own fields.
 */
export const THEME_SETTINGS_FIELDS = [
  { varname: "cp_theme_primary_color", label: "Primary Color", type: "color", defaultValue: "#ec4899" },
  { varname: "cp_theme_secondary_color", label: "Secondary Color", type: "color", defaultValue: "#18181b" },
  { varname: "cp_theme_accent_color", label: "Accent Color", type: "color", defaultValue: "#f472b6" },
  { varname: "cp_theme_dark_mode", label: "Dark Mode (on/off)", type: "text", defaultValue: "on" },
] as const;
