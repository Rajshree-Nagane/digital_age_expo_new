"use client";

import { useActionState } from "react";
import { duplicateEventAction } from "../actions";

const FIELD_CLASS =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-brand-pink focus:outline-none transition-colors";
const LABEL_CLASS = "text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500";

export function DuplicateEventForm({ sourceEventId }: { sourceEventId: number }) {
  const action = duplicateEventAction.bind(null, sourceEventId);
  const [state, formAction, isPending] = useActionState(action, { error: null });

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-white/10 bg-zinc-900/40 p-6">
      <div>
        <h2 className="text-sm font-black uppercase tracking-wider text-zinc-300">Duplicate This Event</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Creates a brand-new event (new find_events.id) with this event&apos;s data copied over — same
          logic as the member portal&apos;s Copy Event button, without the member-role restriction.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input name="title" placeholder="New event title" required className={FIELD_CLASS} />
        <input name="friendly_url" placeholder="new-event-url" required className={FIELD_CLASS} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className={LABEL_CLASS}>Start Date</label>
          <input type="date" name="date_start" required className={FIELD_CLASS} />
        </div>
        <div className="space-y-1">
          <label className={LABEL_CLASS}>End Date</label>
          <input type="date" name="date_end" required className={FIELD_CLASS} />
        </div>
      </div>

      {state.error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-bold text-red-500">{state.error}</div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-brand-pink px-8 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-brand-pink/20 transition hover:scale-[1.02] active:scale-95 disabled:opacity-50"
      >
        {isPending ? "Duplicating..." : "Duplicate"}
      </button>
    </form>
  );
}
