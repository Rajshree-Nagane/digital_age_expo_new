import { requireCpPermission, CP_PERMISSIONS } from "@/lib/cp/rbac";
import { getSettingsGroup, defineSetting } from "@/lib/cp/settings/settingsRepository";
import { listUpcomingEventsForDropdown, getActiveEventId } from "@/lib/cp/events/eventsRepository";
import { GENERAL_SETTINGS_FIELDS } from "./fields";
import { saveGeneralSettingsAction } from "./actions";

const FIELD_CLASS =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-brand-pink focus:outline-none transition-colors";
const LABEL_CLASS = "text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500";

/**
 * Concrete Phase 1 example of a Project Settings sub-page wired to the real find_settings
 * table (not a speculative new cp_settings_general table — see the schema.prisma header
 * comment on the ADMIN CONTROL PANEL block for why). Company/Branding/Theme/SEO/Social
 * follow the same pattern: a fields.ts list + this page shape + an actions.ts save action.
 *
 * The "Event" dropdown below is NOT one of GENERAL_SETTINGS_FIELDS (it isn't a find_settings
 * grouptitle="general" varname) — it reads/writes the same cp_active_event_id setting Events
 * Management's "Mark Active" button uses (see eventsRepository.ts), because this IS the
 * site-wide active event control: whichever event is selected here is what
 * src/lib/services/domain.ts's getDomain() resolves for the entire public/member site.
 */
export default async function GeneralSettingsPage() {
  await requireCpPermission(CP_PERMISSIONS.SETTINGS_VIEW);

  // Idempotent: only inserts a row the very first time a field is loaded on this domain.
  for (const field of GENERAL_SETTINGS_FIELDS) {
    await defineSetting({
      varname: field.varname,
      grouptitle: "general",
      value: field.defaultValue,
      optioncodeType: field.type,
    });
  }

  const [rows, upcomingEvents, activeEventId] = await Promise.all([
    getSettingsGroup("general"),
    listUpcomingEventsForDropdown(),
    getActiveEventId(),
  ]);
  const valueByVarname = new Map(rows.map((r) => [r.varname, r.value ?? ""]));

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-black uppercase tracking-wider text-white">General Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Stored in find_settings (grouptitle=&quot;general&quot;) — the same table the legacy
          admin panel&apos;s own Settings screen reads and writes.
        </p>
      </div>

      <form action={saveGeneralSettingsAction} className="space-y-5 rounded-2xl border border-white/10 bg-zinc-900/40 p-6">
        {GENERAL_SETTINGS_FIELDS.map((field) => (
          <div key={field.varname} className="space-y-2">
            <label className={LABEL_CLASS}>{field.label}</label>
            <input
              name={field.varname}
              defaultValue={valueByVarname.get(field.varname) ?? field.defaultValue}
              className={FIELD_CLASS}
            />
          </div>
        ))}

        <div className="space-y-2 border-t border-white/5 pt-5">
          <label className={LABEL_CLASS}>Event</label>
          <select name="event_id" defaultValue={activeEventId ?? ""} className={FIELD_CLASS}>
            <option value="">Select an Event</option>
            {upcomingEvents.map((event) => (
              <option key={event.id} value={event.id}>
                {event.id} - {event.title}
              </option>
            ))}
          </select>
          <p className="text-xs text-zinc-600">
            Only upcoming events are listed (past events are hidden). Whichever event is selected here becomes the
            site-wide active event — it&apos;s what the entire public/member site shows via getDomain(), same
            setting as Events Management&apos;s &quot;Mark Active&quot; button.
          </p>
        </div>

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
