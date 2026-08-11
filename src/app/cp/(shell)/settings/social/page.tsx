import { getDomainSettings } from "@/lib/cp/settings/domainRepository";
import { getSettingsGroup, defineSetting } from "@/lib/cp/settings/settingsRepository";
import { SOCIAL_PLATFORMS, urlFieldName, enabledFieldName, orderFieldName } from "./fields";
import { saveSocialMediaAction } from "./actions";
import { SettingsForm } from "../_components/SettingsForm";
import { FIELD_CLASS, LABEL_CLASS, HINT_CLASS, CHECKBOX_CLASS } from "../_components/styles";

/** Social Media — five platforms read/write find_domains directly (the same row Company Details
 * edits); three (TikTok/WhatsApp/Pinterest) plus every platform's enabled/order flag live in
 * find_settings (grouptitle="social"). See fields.ts for the exact split. */
export default async function SocialMediaPage() {
  for (const platform of SOCIAL_PLATFORMS) {
    if (platform.urlSource === "setting") {
      await defineSetting({ varname: urlFieldName(platform.key), grouptitle: "social", value: "", optioncodeType: "text" });
    }
    await defineSetting({ varname: enabledFieldName(platform.key), grouptitle: "social", value: "on", optioncodeType: "text" });
    await defineSetting({
      varname: orderFieldName(platform.key),
      grouptitle: "social",
      value: String(SOCIAL_PLATFORMS.indexOf(platform)),
      optioncodeType: "text",
    });
  }

  const [domain, settingRows] = await Promise.all([getDomainSettings(), getSettingsGroup("social")]);
  const settingByVarname = new Map(settingRows.map((r) => [r.varname, r.value ?? ""]));
  const domainUrlByKey: Record<string, string | null> = {
    facebook: domain.facebook,
    instagram: domain.instagram,
    linkedin: domain.linkedin,
    twitter: domain.twitter,
    youtube: domain.youtube,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black uppercase tracking-wider text-white">Social Media</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Only enabled platforms are shown on the public site. Order controls the display sequence (lower first).
        </p>
      </div>

      <SettingsForm action={saveSocialMediaAction}>
        <div className="space-y-4">
          {SOCIAL_PLATFORMS.map((platform) => {
            const urlName = urlFieldName(platform.key);
            const urlValue = platform.urlSource === "domain" ? domainUrlByKey[platform.key] ?? "" : settingByVarname.get(urlName) ?? "";
            const enabledValue = (settingByVarname.get(enabledFieldName(platform.key)) ?? "on") === "on";
            const orderValue = settingByVarname.get(orderFieldName(platform.key)) ?? "0";

            return (
              <div key={platform.key} className="grid gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
                <div className="space-y-2">
                  <label className={LABEL_CLASS} htmlFor={urlName}>
                    {platform.label} URL
                  </label>
                  <input id={urlName} name={urlName} type="url" defaultValue={urlValue} className={FIELD_CLASS} />
                </div>
                <div className="space-y-2">
                  <label className={LABEL_CLASS} htmlFor={orderFieldName(platform.key)}>
                    Order
                  </label>
                  <input
                    id={orderFieldName(platform.key)}
                    name={orderFieldName(platform.key)}
                    defaultValue={orderValue}
                    className={`${FIELD_CLASS} w-20`}
                  />
                </div>
                <label className="flex items-center gap-2 pb-3 sm:pb-0">
                  <input
                    type="checkbox"
                    name={enabledFieldName(platform.key)}
                    defaultChecked={enabledValue}
                    className={CHECKBOX_CLASS}
                  />
                  <span className={LABEL_CLASS}>Enabled</span>
                </label>
              </div>
            );
          })}
        </div>

        <div className="space-y-2 border-t border-white/5 pt-6">
          <label className={LABEL_CLASS} htmlFor="google">
            Google (Profile / Business Link)
          </label>
          <input id="google" name="google" defaultValue={domain.google ?? ""} className={FIELD_CLASS} />
          <p className={HINT_CLASS}>Legacy field — a Google+/Business profile link, not part of the toggleable platform list above.</p>
        </div>
      </SettingsForm>
    </div>
  );
}
