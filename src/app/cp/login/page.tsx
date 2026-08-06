"use client";

import { useActionState } from "react";
import { loginAction, type CpLoginState } from "./actions";

const FIELD_CLASS =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-brand-pink focus:outline-none transition-colors";

const initialState: CpLoginState = { error: null };

export default function CpLoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900/60 p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-lg font-black uppercase tracking-wider text-white">Admin Control Panel</h1>
          <p className="mt-1 text-xs text-zinc-500">Sign in with your admin account</p>
        </div>

        <form action={formAction} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
              Email or Username
            </label>
            <input name="identifier" type="text" autoComplete="username" required className={FIELD_CLASS} />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Password</label>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className={FIELD_CLASS}
            />
          </div>

          {state.error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-bold text-red-500">
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-full bg-brand-pink px-10 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-brand-pink/20 transition hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            {isPending ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-8 text-center text-[11px] text-zinc-600">
          Uses your existing site account — the same login as the member portal. Access is granted
          per role by an administrator (User Management &rarr; Groups).
        </p>
      </div>
    </div>
  );
}
