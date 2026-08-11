import { getSettingsGroup, defineSetting } from "@/lib/cp/settings/settingsRepository";
import { THEME_SETTINGS_FIELDS, THEME_COLOR_FIELDS } from "./fields";
import { saveThemeSettingsAction } from "./actions";
import { SettingsForm } from "../_components/SettingsForm";
import { LABEL_CLASS, CHECKBOX_ROW_CLASS, CHECKBOX_CLASS } from "../_components/styles";

/**
 * Theme — stored in find_settings (grouptitle="theme"), NOT find_domains. Unlike Company/
 * Social/Branding (real find_domains columns), find_domains has no theme-color field at all,
 * so this follows the same find_settings pattern General Settings uses instead. Once Phase 2
 * wires the public site to these values, each color below becomes a CSS custom property the
 * whole site reads from, replacing whatever is currently hardcoded.
 */
export default async function ThemeSettingsPage() {
  for (const field of THEME_SETTINGS_FIELDS) {
    await defineSetting({
      varname: field.varname,
      grouptitle: "theme",
      value: field.defaultValue,
      // find_settings.optioncode_type is a fixed Postgres enum (text/textarea/select/radio/
      // checkbox/file/eval/text_tags/number_toggle) with no "color" member — this page renders
      // its own <input type="color"> (or checkbox) based on field.type below, independently of
      // what's stored here, so "text" is always a safe, valid value to persist.
      optioncodeType: "text",
    });
  }

  const rows = await getSettingsGroup("theme");
  const valueByVarname = new Map(rows.map((r) => [r.varname, r.value ?? ""]));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black uppercase tracking-wider text-white">Theme</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Site-wide color palette. Stored in find_settings (grouptitle=&quot;theme&quot;) — see the Branding tab for
          the legacy `template` field.
        </p>
      </div>

      <SettingsForm action={saveThemeSettingsAction}>
        <div className="grid gap-5 sm:grid-cols-2">
          {THEME_COLOR_FIELDS.map((field) => (
            <div key={field.varname} className="space-y-2">
              <label className={LABEL_CLASS} htmlFor={field.varname}>
                {field.label}
              </label>
              <div className="flex items-center gap-3">
                <input
                  id={field.varname}
                  type="color"
                  name={field.varname}
                  defaultValue={valueByVarname.get(field.varname) || field.defaultValue}
                  className="h-11 w-16 cursor-pointer rounded-lg border border-white/10 bg-white/5"
                />
                <span className="text-xs text-zinc-500">{valueByVarname.get(field.varname) || field.defaultValue}</span>
              </div>
            </div>
          ))}
        </div>

        <label className={`${CHECKBOX_ROW_CLASS} border-t border-white/5 pt-6`}>
          <input
            type="checkbox"
            name="cp_theme_dark_mode"
            defaultChecked={(valueByVarname.get("cp_theme_dark_mode") || "on") === "on"}
            className={CHECKBOX_CLASS}
          />
          <span className={LABEL_CLASS}>Dark Mode</span>
        </label>
      </SettingsForm>
    </div>
  );
}
