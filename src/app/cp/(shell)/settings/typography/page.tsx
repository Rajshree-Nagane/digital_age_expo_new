import { getSettingsGroup, defineSetting } from "@/lib/cp/settings/settingsRepository";
import { TYPOGRAPHY_SETTINGS_FIELDS } from "./fields";
import { saveTypographySettingsAction } from "./actions";
import { SettingsForm } from "../_components/SettingsForm";
import { FIELD_CLASS, LABEL_CLASS, HINT_CLASS } from "../_components/styles";

export default async function TypographySettingsPage() {
  for (const field of TYPOGRAPHY_SETTINGS_FIELDS) {
    await defineSetting({ varname: field.varname, grouptitle: "typography", value: field.defaultValue, optioncodeType: "text" });
  }

  const rows = await getSettingsGroup("typography");
  const valueByVarname = new Map(rows.map((r) => [r.varname, r.value ?? ""]));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black uppercase tracking-wider text-white">Typography</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Font family and scale settings. Stored in find_settings (grouptitle=&quot;typography&quot;) — this site&apos;s
          current fonts are hardcoded CSS variables in globals.css; these values are the intended replacements for
          when the public layout is wired to read them dynamically.
        </p>
      </div>

      <SettingsForm action={saveTypographySettingsAction}>
        <div className="grid gap-5 sm:grid-cols-2">
          {TYPOGRAPHY_SETTINGS_FIELDS.map((field) => (
            <div key={field.varname} className="space-y-2">
              <label className={LABEL_CLASS} htmlFor={field.varname}>
                {field.label}
              </label>
              <input
                id={field.varname}
                name={field.varname}
                defaultValue={valueByVarname.get(field.varname) ?? field.defaultValue}
                className={FIELD_CLASS}
              />
            </div>
          ))}
        </div>
        <p className={HINT_CLASS}>Font names should match an available web-safe or loaded font family exactly.</p>
      </SettingsForm>
    </div>
  );
}
