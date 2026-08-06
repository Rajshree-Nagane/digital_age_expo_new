import { requireCpPermission, CP_PERMISSIONS } from "@/lib/cp/rbac";
import { getSettingsGroup, defineSetting } from "@/lib/cp/settings/settingsRepository";
import { THEME_SETTINGS_FIELDS } from "./fields";
import { saveThemeSettingsAction } from "./actions";

const LABEL_CLASS = "text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500";
const FIELD_CLASS =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-brand-pink focus:outline-none transition-colors";

/**
 * Theme — stored in find_settings (grouptitle="theme"), NOT find_domains. Unlike Company/
 * Social/Branding (real find_domains columns), find_domains has no theme-color field at all,
 * so this follows the same find_settings pattern General Settings uses instead.
 */
export default async function ThemeSettingsPage() {
  await requireCpPermission(CP_PERMISSIONS.SETTINGS_VIEW);

  for (const field of THEME_SETTINGS_FIELDS) {
    await defineSetting({
      varname: field.varname,
      grouptitle: "theme",
      value: field.defaultValue,
      // find_settings.optioncode_type is a fixed MySQL ENUM (text/textarea/select/radio/
      // checkbox/file/eval/text_tags/number_toggle) with no "color" member — passing
      // field.type ("color" for the color pickers) straight through fails with MySQL's
      // "Data truncated for column" error. This column only describes how the LEGACY admin
      // panel would render the field; this page renders its own <input type="color">
      // based on field.type below, independently of what's stored here, so "text" is always
      // a safe, valid value to persist.
      optioncodeType: "text",
    });
  }

  const rows = await getSettingsGroup("theme");
  const valueByVarname = new Map(rows.map((r) => [r.varname, r.value ?? ""]));

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-black uppercase tracking-wider text-white">Theme</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Stored in find_settings (grouptitle=&quot;theme&quot;) — a new section, since find_domains has no
          theme-color column to surface. See the Branding page for the legacy `template` field.
        </p>
      </div>

      <form action={saveThemeSettingsAction} className="space-y-5 rounded-2xl border border-white/10 bg-zinc-900/40 p-6">
        {THEME_SETTINGS_FIELDS.map((field) => (
          <div key={field.varname} className="space-y-2">
            <label className={LABEL_CLASS}>{field.label}</label>
            {field.type === "color" ? (
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  name={field.varname}
                  defaultValue={valueByVarname.get(field.varname) || field.defaultValue}
                  className="h-11 w-16 cursor-pointer rounded-lg border border-white/10 bg-white/5"
                />
                <span className="text-xs text-zinc-500">{valueByVarname.get(field.varname) || field.defaultValue}</span>
              </div>
            ) : (
              <input
                name={field.varname}
                defaultValue={valueByVarname.get(field.varname) ?? field.defaultValue}
                className={FIELD_CLASS}
              />
            )}
          </div>
        ))}

        <div className="flex justify-end border-t border-white/5 pt-6">
          <button
            type="submit"
            className="rounded-full bg-brand-pink px-10 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-brand-pink/20 transition hover:scale-[1.02] active:scale-95"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
