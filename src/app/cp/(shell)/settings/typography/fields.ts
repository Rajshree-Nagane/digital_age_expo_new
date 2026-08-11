/**
 * Typography field catalog — find_settings, grouptitle="typography". Genuinely new: this
 * project's fonts are currently hardcoded CSS custom properties in src/app/globals.css
 * (--font-sans: "Plus Jakarta Sans"..., --font-display: "Outfit"...), not driven by next/font
 * or any DB-backed config. These settings don't replace that file — Phase 2 is what would make
 * the public layout read these values and override those CSS variables at runtime; for now this
 * page just gives the CP a place to record the intended values.
 */
export const TYPOGRAPHY_SETTINGS_FIELDS = [
  { varname: "cp_typography_primary_font", label: "Primary Font", defaultValue: "Plus Jakarta Sans" },
  { varname: "cp_typography_secondary_font", label: "Secondary Font", defaultValue: "Inter" },
  { varname: "cp_typography_heading_font", label: "Heading Font", defaultValue: "Outfit" },
  { varname: "cp_typography_body_font", label: "Body Font", defaultValue: "Plus Jakarta Sans" },
  { varname: "cp_typography_base_font_size", label: "Base Font Size (px)", defaultValue: "16" },
  { varname: "cp_typography_heading_scale", label: "Heading Scale", defaultValue: "1.25" },
] as const;
