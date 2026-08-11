/**
 * Theme settings field catalog — the varnames stored in find_settings under grouptitle="theme".
 *
 * find_domains (the legacy Domain Details row) has no color/hex column anywhere, so there is no
 * existing "theme color" to read — this is a genuinely NEW setting, not a legacy field being
 * surfaced. It follows the exact fallback settingsRepository.ts already documents for this case
 * ("settings the legacy schema never had a varname for yet"), the same mechanism General
 * Settings already uses for its own fields.
 */
export const THEME_COLOR_FIELDS = [
  { varname: "cp_theme_primary_color", label: "Primary Color", defaultValue: "#ec4899" },
  { varname: "cp_theme_secondary_color", label: "Secondary Color", defaultValue: "#18181b" },
  { varname: "cp_theme_accent_color", label: "Accent Color", defaultValue: "#f472b6" },
  { varname: "cp_theme_background_color", label: "Background Color", defaultValue: "#09090b" },
  { varname: "cp_theme_text_color", label: "Text Color", defaultValue: "#e4e4e7" },
  { varname: "cp_theme_heading_color", label: "Heading Color", defaultValue: "#ffffff" },
  { varname: "cp_theme_button_color", label: "Button Color", defaultValue: "#ec4899" },
  { varname: "cp_theme_button_hover_color", label: "Button Hover Color", defaultValue: "#db2777" },
  { varname: "cp_theme_link_color", label: "Link Color", defaultValue: "#f472b6" },
] as const;

export const THEME_SETTINGS_FIELDS = [
  ...THEME_COLOR_FIELDS.map((f) => ({ varname: f.varname, label: f.label, type: "color", defaultValue: f.defaultValue })),
  { varname: "cp_theme_dark_mode", label: "Dark Mode", type: "checkbox", defaultValue: "on" },
] as const;
