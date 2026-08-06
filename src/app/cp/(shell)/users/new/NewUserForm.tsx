"use client";

import { useActionState } from "react";
import { createUserAction, type CreateUserState } from "../actions";
import { COUNTRIES } from "@/lib/constants/countries";

const FIELD_CLASS =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-brand-pink focus:outline-none transition-colors";
const SELECT_CLASS = FIELD_CLASS + " appearance-none";
const LABEL_CLASS = "text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500";
const CHECKBOX_ROW_CLASS = "flex items-center gap-2 text-sm text-zinc-300";
const CHECKBOX_CLASS = "h-4 w-4 rounded border-white/20 bg-transparent accent-brand-pink";
const FIELDSET_CLASS = "space-y-5 border-t border-white/10 pt-6 first-of-type:border-0 first-of-type:pt-0";
const LEGEND_CLASS = "text-xs font-black uppercase tracking-widest text-white";

// Mirrors admin_users.php's own curated Time Zone dropdown field-for-field, so a value saved
// here reads back the same way the legacy admin panel would have shown it.
const TIMEZONES = [
  ["Kwajalein", "(UTC-12:00) International Date Line West"],
  ["Pacific/Midway", "(UTC-11:00) Midway Island"],
  ["Pacific/Samoa", "(UTC-11:00) Samoa"],
  ["Pacific/Honolulu", "(UTC-10:00) Hawaii"],
  ["America/Anchorage", "(UTC-09:00) Alaska"],
  ["America/Los_Angeles", "(UTC-08:00) Pacific Time (US & Canada)"],
  ["America/Tijuana", "(UTC-08:00) Tijuana, Baja California"],
  ["America/Denver", "(UTC-07:00) Mountain Time (US & Canada)"],
  ["America/Chihuahua", "(UTC-07:00) Chihuahua"],
  ["America/Mazatlan", "(UTC-07:00) Mazatlan"],
  ["America/Phoenix", "(UTC-07:00) Arizona"],
  ["America/Regina", "(UTC-06:00) Saskatchewan"],
  ["America/Tegucigalpa", "(UTC-06:00) Central America"],
  ["America/Chicago", "(UTC-06:00) Central Time (US & Canada)"],
  ["America/Mexico_City", "(UTC-06:00) Mexico City"],
  ["America/Monterrey", "(UTC-06:00) Monterrey"],
  ["America/New_York", "(UTC-05:00) Eastern Time (US & Canada)"],
  ["America/Bogota", "(UTC-05:00) Bogota"],
  ["America/Lima", "(UTC-05:00) Lima"],
  ["America/Rio_Branco", "(UTC-05:00) Rio Branco"],
  ["America/Indiana/Indianapolis", "(UTC-05:00) Indiana (East)"],
  ["America/Caracas", "(UTC-04:30) Caracas"],
  ["America/Halifax", "(UTC-04:00) Atlantic Time (Canada)"],
  ["America/Manaus", "(UTC-04:00) Manaus"],
  ["America/Santiago", "(UTC-04:00) Santiago"],
  ["America/La_Paz", "(UTC-04:00) La Paz"],
  ["America/St_Johns", "(UTC-03:30) Newfoundland"],
  ["America/Moncton", "(UTC-03:00) Georgetown"],
  ["America/Sao_Paulo", "(UTC-03:00) Brasilia"],
  ["America/Godthab", "(UTC-03:00) Greenland"],
  ["America/Montevideo", "(UTC-03:00) Montevideo"],
  ["Atlantic/South_Georgia", "(UTC-02:00) Mid-Atlantic"],
  ["Atlantic/Azores", "(UTC-01:00) Azores"],
  ["Atlantic/Cape_Verde", "(UTC-01:00) Cape Verde Is."],
  ["Europe/Dublin", "(UTC) Dublin"],
  ["Europe/Lisbon", "(UTC) Lisbon"],
  ["Europe/London", "(UTC) London"],
  ["Africa/Monrovia", "(UTC) Monrovia"],
  ["Atlantic/Reykjavik", "(UTC) Reykjavik"],
  ["Africa/Casablanca", "(UTC) Casablanca"],
  ["Europe/Belgrade", "(UTC+01:00) Belgrade"],
  ["Europe/Bratislava", "(UTC+01:00) Bratislava"],
  ["Europe/Budapest", "(UTC+01:00) Budapest"],
  ["Europe/Ljubljana", "(UTC+01:00) Ljubljana"],
  ["Europe/Prague", "(UTC+01:00) Prague"],
  ["Europe/Sarajevo", "(UTC+01:00) Sarajevo"],
  ["Europe/Skopje", "(UTC+01:00) Skopje"],
  ["Europe/Warsaw", "(UTC+01:00) Warsaw"],
  ["Europe/Zagreb", "(UTC+01:00) Zagreb"],
  ["Europe/Brussels", "(UTC+01:00) Brussels"],
  ["Europe/Copenhagen", "(UTC+01:00) Copenhagen"],
  ["Europe/Madrid", "(UTC+01:00) Madrid"],
  ["Europe/Paris", "(UTC+01:00) Paris"],
  ["Africa/Algiers", "(UTC+01:00) West Central Africa"],
  ["Europe/Amsterdam", "(UTC+01:00) Amsterdam"],
  ["Europe/Berlin", "(UTC+01:00) Berlin"],
  ["Europe/Rome", "(UTC+01:00) Rome"],
  ["Europe/Stockholm", "(UTC+01:00) Stockholm"],
  ["Europe/Vienna", "(UTC+01:00) Vienna"],
  ["Europe/Minsk", "(UTC+02:00) Minsk"],
  ["Africa/Cairo", "(UTC+02:00) Cairo"],
  ["Europe/Helsinki", "(UTC+02:00) Helsinki"],
  ["Europe/Riga", "(UTC+02:00) Riga"],
  ["Europe/Sofia", "(UTC+02:00) Sofia"],
  ["Europe/Tallinn", "(UTC+02:00) Tallinn"],
  ["Europe/Vilnius", "(UTC+02:00) Vilnius"],
  ["Europe/Athens", "(UTC+02:00) Athens"],
  ["Europe/Bucharest", "(UTC+02:00) Bucharest"],
  ["Europe/Istanbul", "(UTC+02:00) Istanbul"],
  ["Asia/Jerusalem", "(UTC+02:00) Jerusalem"],
  ["Asia/Amman", "(UTC+02:00) Amman"],
  ["Asia/Beirut", "(UTC+02:00) Beirut"],
  ["Africa/Windhoek", "(UTC+02:00) Windhoek"],
  ["Africa/Harare", "(UTC+02:00) Harare"],
  ["Asia/Kuwait", "(UTC+03:00) Kuwait"],
  ["Asia/Riyadh", "(UTC+03:00) Riyadh"],
  ["Asia/Baghdad", "(UTC+03:00) Baghdad"],
  ["Africa/Nairobi", "(UTC+03:00) Nairobi"],
  ["Asia/Tbilisi", "(UTC+03:00) Tbilisi"],
  ["Europe/Moscow", "(UTC+03:00) Moscow"],
  ["Europe/Volgograd", "(UTC+03:00) Volgograd"],
  ["Asia/Tehran", "(UTC+03:30) Tehran"],
  ["Asia/Muscat", "(UTC+04:00) Muscat"],
  ["Asia/Baku", "(UTC+04:00) Baku"],
  ["Asia/Yerevan", "(UTC+04:00) Yerevan"],
  ["Asia/Kabul", "(UTC+04:30) Kabul"],
  ["Asia/Yekaterinburg", "(UTC+05:00) Ekaterinburg"],
  ["Asia/Karachi", "(UTC+05:00) Karachi"],
  ["Asia/Tashkent", "(UTC+05:00) Tashkent"],
  ["Asia/Calcutta", "(UTC+05:30) Calcutta"],
  ["Asia/Colombo", "(UTC+05:30) Sri Jayawardenepura"],
  ["Asia/Katmandu", "(UTC+05:45) Kathmandu"],
  ["Asia/Dhaka", "(UTC+06:00) Dhaka"],
  ["Asia/Almaty", "(UTC+06:00) Almaty"],
  ["Asia/Novosibirsk", "(UTC+06:00) Novosibirsk"],
  ["Asia/Rangoon", "(UTC+06:30) Yangon (Rangoon)"],
  ["Asia/Krasnoyarsk", "(UTC+07:00) Krasnoyarsk"],
  ["Asia/Bangkok", "(UTC+07:00) Bangkok"],
  ["Asia/Jakarta", "(UTC+07:00) Jakarta"],
  ["Asia/Brunei", "(UTC+08:00) Beijing"],
  ["Asia/Chongqing", "(UTC+08:00) Chongqing"],
  ["Asia/Hong_Kong", "(UTC+08:00) Hong Kong"],
  ["Asia/Urumqi", "(UTC+08:00) Urumqi"],
  ["Asia/Irkutsk", "(UTC+08:00) Irkutsk"],
  ["Asia/Ulaanbaatar", "(UTC+08:00) Ulaan Bataar"],
  ["Asia/Kuala_Lumpur", "(UTC+08:00) Kuala Lumpur"],
  ["Asia/Singapore", "(UTC+08:00) Singapore"],
  ["Asia/Taipei", "(UTC+08:00) Taipei"],
  ["Australia/Perth", "(UTC+08:00) Perth"],
  ["Asia/Seoul", "(UTC+09:00) Seoul"],
  ["Asia/Tokyo", "(UTC+09:00) Tokyo"],
  ["Asia/Yakutsk", "(UTC+09:00) Yakutsk"],
  ["Australia/Darwin", "(UTC+09:30) Darwin"],
  ["Australia/Adelaide", "(UTC+09:30) Adelaide"],
  ["Australia/Canberra", "(UTC+10:00) Canberra"],
  ["Australia/Melbourne", "(UTC+10:00) Melbourne"],
  ["Australia/Sydney", "(UTC+10:00) Sydney"],
  ["Australia/Brisbane", "(UTC+10:00) Brisbane"],
  ["Australia/Hobart", "(UTC+10:00) Hobart"],
  ["Asia/Vladivostok", "(UTC+10:00) Vladivostok"],
  ["Pacific/Guam", "(UTC+10:00) Guam"],
  ["Pacific/Port_Moresby", "(UTC+10:00) Port Moresby"],
  ["Asia/Magadan", "(UTC+11:00) Magadan"],
  ["Pacific/Fiji", "(UTC+12:00) Fiji"],
  ["Asia/Kamchatka", "(UTC+12:00) Kamchatka"],
  ["Pacific/Auckland", "(UTC+12:00) Auckland"],
  ["Pacific/Tongatapu", "(UTC+13:00) Nuku'alofa"],
  ["Pacific/Kiritimati", "(UTC+14:00) Kiritimati"],
] as const;

const SECURITY_QUESTIONS = [
  "What was the name of your elementary school?",
  "What was the name of your first pet?",
  "What was your childhood nickname?",
  "What was the first car you owned?",
  "What is the name of your favorite childhood friend?",
] as const;

const SELLER_GRADES = ["Grade One", "Grade Two", "Grade Three"] as const;

const initialState: CreateUserState = { error: null };

export function NewUserForm({ allGroups }: { allGroups: { id: number; name: string }[] }) {
  const [state, formAction, isPending] = useActionState(createUserAction, initialState);

  return (
    <form action={formAction} className="space-y-8 rounded-2xl border border-white/10 bg-zinc-900/40 p-6">
      {/* User Information */}
      <fieldset className={FIELDSET_CLASS}>
        <legend className={LEGEND_CLASS}>User Information</legend>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className={LABEL_CLASS}>Username *</label>
            <input name="login" required className={FIELD_CLASS} />
          </div>
          <div className="space-y-2">
            <label className={LABEL_CLASS}>Password *</label>
            <input name="password" type="password" required minLength={6} className={FIELD_CLASS} />
          </div>
        </div>

        <div className="space-y-2">
          <label className={LABEL_CLASS}>Email *</label>
          <input name="email" type="email" required className={FIELD_CLASS} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className={LABEL_CLASS}>First Name</label>
            <input name="firstName" className={FIELD_CLASS} />
          </div>
          <div className="space-y-2">
            <label className={LABEL_CLASS}>Last Name</label>
            <input name="lastName" className={FIELD_CLASS} />
          </div>
        </div>

        <div className="space-y-2">
          <label className={LABEL_CLASS}>Organization</label>
          <input name="organization" className={FIELD_CLASS} />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <label className={CHECKBOX_ROW_CLASS}>
            <input type="checkbox" name="disableOverdueNotices" value="1" className={CHECKBOX_CLASS} />
            Disable Overdue Notices
          </label>
          <label className={CHECKBOX_ROW_CLASS}>
            <input type="checkbox" name="taxExempt" value="1" className={CHECKBOX_CLASS} />
            Tax Exempt
          </label>
          <label className={CHECKBOX_ROW_CLASS}>
            <input type="checkbox" name="moderateDisable" value="1" className={CHECKBOX_CLASS} />
            Disable Moderation
          </label>
        </div>

        <div className="space-y-2">
          <label className={LABEL_CLASS}>Time Zone</label>
          <select name="timezone" defaultValue="" className={SELECT_CLASS}>
            <option value="" className="bg-zinc-900" />
            {TIMEZONES.map(([value, label]) => (
              <option key={value} value={value} className="bg-zinc-900">
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className={LABEL_CLASS}>Signature</label>
          <textarea name="signature" rows={3} className={FIELD_CLASS} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className={LABEL_CLASS}>VAT ID</label>
            <input name="vatId" placeholder="For European countries" className={FIELD_CLASS} />
          </div>
          <div className="flex items-end pb-3">
            <label className={CHECKBOX_ROW_CLASS}>
              <input type="checkbox" name="invoicesByEmail" value="1" defaultChecked className={CHECKBOX_CLASS} />
              Send Invoices via Email
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className={LABEL_CLASS}>Security Question</label>
            <select name="securityQuestion" defaultValue="" className={SELECT_CLASS}>
              <option value="" className="bg-zinc-900">
                Select a question
              </option>
              {SECURITY_QUESTIONS.map((q) => (
                <option key={q} value={q} className="bg-zinc-900">
                  {q}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className={LABEL_CLASS}>Security Answer</label>
            <input name="securityAnswer" className={FIELD_CLASS} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className={CHECKBOX_ROW_CLASS}>
            <input type="checkbox" name="sellerAccount" value="1" className={CHECKBOX_CLASS} />
            Enable Seller Account
          </label>
          <div className="space-y-2">
            <label className={LABEL_CLASS}>Your Session Cost</label>
            <input name="sessionCost" defaultValue="0" className={FIELD_CLASS} />
          </div>
        </div>

        <div className="space-y-2">
          <label className={LABEL_CLASS}>Seller Grade</label>
          <div className="flex flex-wrap gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
            {SELLER_GRADES.map((grade) => (
              <label key={grade} className={CHECKBOX_ROW_CLASS}>
                <input type="checkbox" name="sellerGrades" value={grade} className={CHECKBOX_CLASS} />
                {grade}
              </label>
            ))}
          </div>
        </div>
      </fieldset>

      {/* Address */}
      <fieldset className={FIELDSET_CLASS}>
        <legend className={LEGEND_CLASS}>Address</legend>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className={LABEL_CLASS}>Address Line 1</label>
            <input name="address1" className={FIELD_CLASS} />
          </div>
          <div className="space-y-2">
            <label className={LABEL_CLASS}>Address Line 2</label>
            <input name="address2" className={FIELD_CLASS} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className={LABEL_CLASS}>City</label>
            <input name="city" className={FIELD_CLASS} />
          </div>
          <div className="space-y-2">
            <label className={LABEL_CLASS}>State</label>
            <input name="state" className={FIELD_CLASS} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className={LABEL_CLASS}>Country</label>
            <select name="country" defaultValue="" className={SELECT_CLASS}>
              <option value="" className="bg-zinc-900" />
              {COUNTRIES.map((c) => (
                <option key={c} value={c} className="bg-zinc-900">
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className={LABEL_CLASS}>Zip Code</label>
            <input name="zip" className={FIELD_CLASS} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className={LABEL_CLASS}>Phone</label>
            <input name="phone" className={FIELD_CLASS} />
          </div>
          <div className="space-y-2">
            <label className={LABEL_CLASS}>Fax</label>
            <input name="fax" className={FIELD_CLASS} />
          </div>
        </div>
      </fieldset>

      {/* Notifications */}
      <fieldset className={FIELDSET_CLASS}>
        <legend className={LEGEND_CLASS}>Notifications</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className={CHECKBOX_ROW_CLASS}>
            <input type="checkbox" name="favoritesNotify" value="1" className={CHECKBOX_CLASS} />
            Favorites Updated
          </label>
          <label className={CHECKBOX_ROW_CLASS}>
            <input type="checkbox" name="enableEventbrite" value="1" className={CHECKBOX_CLASS} />
            Enable Event Brite
          </label>
          <label className={CHECKBOX_ROW_CLASS}>
            <input type="checkbox" name="franchiseAllowExport" value="1" className={CHECKBOX_CLASS} />
            Allow Export for Allocated Users
          </label>
          <label className={CHECKBOX_ROW_CLASS}>
            <input type="checkbox" name="franchiseAllowExportListings" value="1" className={CHECKBOX_CLASS} />
            Allow Export for Allocated Business
          </label>
          <label className={CHECKBOX_ROW_CLASS}>
            <input type="checkbox" name="franchiseAllowExportRegiRequest" value="1" className={CHECKBOX_CLASS} />
            Allow Export for Request for Registration
          </label>
        </div>
      </fieldset>

      {/* User Groups */}
      <fieldset className={FIELDSET_CLASS}>
        <legend className={LEGEND_CLASS}>User Groups *</legend>
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/5 p-4">
          {allGroups.map((group) => (
            <label key={group.id} className={CHECKBOX_ROW_CLASS}>
              <input type="checkbox" name="groupIds" value={group.id} className={CHECKBOX_CLASS} />
              {group.name}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Comments */}
      <fieldset className={FIELDSET_CLASS}>
        <legend className={LEGEND_CLASS}>Comments</legend>
        <textarea name="comment" rows={4} className={FIELD_CLASS} />
      </fieldset>

      {/* Other */}
      <fieldset className={FIELDSET_CLASS}>
        <legend className={LEGEND_CLASS}>Other</legend>
        <label className={CHECKBOX_ROW_CLASS}>
          <input type="checkbox" name="isSngMember" value="1" className={CHECKBOX_CLASS} />
          Is SNG Member?
        </label>
      </fieldset>

      {state.error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-bold text-red-500">
          {state.error}
        </div>
      )}

      <div className="flex justify-end border-t border-white/5 pt-6">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-brand-pink px-10 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-brand-pink/20 transition hover:scale-[1.02] active:scale-95 disabled:opacity-50"
        >
          {isPending ? "Creating..." : "Create"}
        </button>
      </div>
    </form>
  );
}
