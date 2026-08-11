import { getSettingsGroup, defineSetting } from "@/lib/cp/settings/settingsRepository";
import { FOOTER_TEXT_FIELDS } from "./fields";
import { saveFooterSettingsAction } from "./actions";
import { SettingsForm } from "../_components/SettingsForm";
import { FIELD_CLASS, LABEL_CLASS, HINT_CLASS } from "../_components/styles";

export default async function FooterSettingsPage() {
  for (const field of FOOTER_TEXT_FIELDS) {
    await defineSetting({ varname: field.varname, grouptitle: "footer", value: "", optioncodeType: "text" });
  }

  const rows = await getSettingsGroup("footer");
  const valueByVarname = new Map(rows.map((r) => [r.varname, r.value ?? ""]));
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black uppercase tracking-wider text-white">Footer</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Stored in find_settings (grouptitle=&quot;footer&quot;). Copyright year (currently {currentYear}) is always
          computed automatically, never stored.
        </p>
      </div>

      <SettingsForm action={saveFooterSettingsAction}>
        {FOOTER_TEXT_FIELDS.map((field) => (
          <div key={field.varname} className="space-y-2">
            <label className={LABEL_CLASS} htmlFor={field.varname}>
              {field.label}
            </label>
            {field.kind === "textarea" ? (
              <textarea
                id={field.varname}
                name={field.varname}
                defaultValue={valueByVarname.get(field.varname) ?? ""}
                rows={3}
                className={FIELD_CLASS}
              />
            ) : (
              <input
                id={field.varname}
                name={field.varname}
                type={field.kind === "email" ? "email" : field.kind === "url" ? "url" : "text"}
                defaultValue={valueByVarname.get(field.varname) ?? ""}
                className={FIELD_CLASS}
              />
            )}
            {"hint" in field && field.hint && <p className={HINT_CLASS}>{field.hint}</p>}
          </div>
        ))}
      </SettingsForm>
    </div>
  );
}
