"use client";

import { useActionState, useEffect, useState } from "react";

/**
 * Every Settings sub-page's Server Action now returns this shape instead of `void`/`{ok:true}`
 * — that's what lets this one shared form shell show a real success/error toast, a "Saving..."
 * state, and a disabled-during-save form, none of which the original general/company/branding/
 * social/theme pages had (they were plain `<form action={...}>` with a hard page refresh and no
 * feedback at all). Every action still does its own requireCpPermission()/Zod validation
 * server-side first — this component only renders whatever the action reports back.
 */
export type SettingsActionState = { success: boolean; message: string };

export const INITIAL_SETTINGS_ACTION_STATE: SettingsActionState = { success: false, message: "" };

export function SettingsForm({
  action,
  children,
  saveLabel = "Save Changes",
}: {
  action: (prevState: SettingsActionState, formData: FormData) => Promise<SettingsActionState>;
  children: React.ReactNode;
  saveLabel?: string;
}) {
  const [state, formAction, isPending] = useActionState(action, INITIAL_SETTINGS_ACTION_STATE);
  const [dirty, setDirty] = useState(false);

  // A save that came back (success OR a validation error) means the just-submitted values are
  // now what's on screen / what the server has — either way "unsaved changes" no longer applies
  // to that submission. A fresh edit right after still re-arms it via the form's onChange below.
  useEffect(() => {
    if (state.message) setDirty(false);
  }, [state]);

  useEffect(() => {
    function warnOnUnload(e: BeforeUnloadEvent) {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", warnOnUnload);
    return () => window.removeEventListener("beforeunload", warnOnUnload);
  }, [dirty]);

  return (
    <form
      action={formAction}
      onChange={() => setDirty(true)}
      onReset={() => setDirty(false)}
      className="space-y-6 rounded-2xl border border-white/10 bg-zinc-900/40 p-6"
      noValidate
    >
      <fieldset disabled={isPending} className="space-y-6 border-0 p-0 m-0">
        {children}
      </fieldset>

      <div className="flex flex-col gap-4 border-t border-white/5 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div aria-live="polite" role="status" className="min-h-[1rem] text-xs font-bold">
          {state.message ? (
            <span className={state.success ? "text-emerald-400" : "text-rose-400"}>{state.message}</span>
          ) : dirty ? (
            <span className="text-amber-400">Unsaved changes</span>
          ) : null}
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="reset"
            disabled={isPending}
            className="rounded-full border border-white/10 px-8 py-3.5 text-xs font-black uppercase tracking-widest text-zinc-400 transition hover:bg-white/5 disabled:opacity-50"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-full bg-brand-pink px-10 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-brand-pink/20 transition hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
          >
            {isPending ? "Saving…" : saveLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
