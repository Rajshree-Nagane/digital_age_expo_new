import { getSettingsGroup, defineSetting } from "@/lib/cp/settings/settingsRepository";
import { SEO_TEXT_FIELDS, SEO_ROBOTS_OPTIONS, SEO_IMAGE_FIELDS } from "./fields";
import { saveSeoSettingsAction } from "./actions";
import { SettingsForm } from "../_components/SettingsForm";
import { ImageUploadField } from "../_components/ImageUploadField";
import { FIELD_CLASS, LABEL_CLASS, HINT_CLASS, SECTION_TITLE_CLASS } from "../_components/styles";

export default async function SeoSettingsPage() {
  for (const field of SEO_TEXT_FIELDS) {
    await defineSetting({ varname: field.varname, grouptitle: "seo", value: "", optioncodeType: "text" });
  }
  await defineSetting({ varname: "cp_seo_robots", grouptitle: "seo", value: SEO_ROBOTS_OPTIONS[0], optioncodeType: "text" });
  for (const field of SEO_IMAGE_FIELDS) {
    await defineSetting({ varname: field.varname, grouptitle: "seo", value: "", optioncodeType: "text" });
  }

  const rows = await getSettingsGroup("seo");
  const valueByVarname = new Map(rows.map((r) => [r.varname, r.value ?? ""]));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black uppercase tracking-wider text-white">SEO</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Search engine and social-sharing metadata. Stored in find_settings (grouptitle=&quot;seo&quot;).
        </p>
      </div>

      <SettingsForm action={saveSeoSettingsAction}>
        <div className="space-y-5">
          {SEO_TEXT_FIELDS.map((field) => {
            const value = valueByVarname.get(field.varname) ?? "";
            return (
              <div key={field.varname} className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <label className={LABEL_CLASS} htmlFor={field.varname}>
                    {field.label}
                  </label>
                  <span className={HINT_CLASS}>
                    {value.length}/{field.maxLength}
                  </span>
                </div>
                {"textarea" in field && field.textarea ? (
                  <textarea
                    id={field.varname}
                    name={field.varname}
                    defaultValue={value}
                    maxLength={field.maxLength}
                    rows={3}
                    className={FIELD_CLASS}
                  />
                ) : (
                  <input
                    id={field.varname}
                    name={field.varname}
                    defaultValue={value}
                    maxLength={field.maxLength}
                    className={FIELD_CLASS}
                  />
                )}
              </div>
            );
          })}

          <div className="space-y-2">
            <label className={LABEL_CLASS} htmlFor="cp_seo_robots">
              Robots Meta
            </label>
            <select
              id="cp_seo_robots"
              name="cp_seo_robots"
              defaultValue={valueByVarname.get("cp_seo_robots") || SEO_ROBOTS_OPTIONS[0]}
              className={FIELD_CLASS}
            >
              {SEO_ROBOTS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-5 border-t border-white/5 pt-6">
          <h3 className={SECTION_TITLE_CLASS}>Social Sharing Images</h3>
          <div className="grid gap-6 sm:grid-cols-2">
            {SEO_IMAGE_FIELDS.map((field) => (
              <ImageUploadField
                key={field.varname}
                name={field.varname}
                slot={field.slot}
                label={field.label}
                initialUrl={valueByVarname.get(field.varname) || null}
                hint={field.hint}
              />
            ))}
          </div>
        </div>
      </SettingsForm>
    </div>
  );
}
