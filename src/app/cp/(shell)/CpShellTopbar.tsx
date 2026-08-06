import { logoutAction } from "@/app/cp/login/actions";
import type { CpSessionPayload } from "@/lib/cp/auth/session";

export function CpShellTopbar({ session }: { session: CpSessionPayload }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-white/10 bg-zinc-950/60 px-6">
      <div className="text-xs text-zinc-500">
        <span className="text-zinc-300">{session.name}</span> &middot; {session.groupName}
      </div>
      <form action={logoutAction}>
        <button
          type="submit"
          className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-[11px] font-black uppercase tracking-widest text-zinc-300 transition hover:bg-white/10 hover:text-white"
        >
          Sign Out
        </button>
      </form>
    </header>
  );
}
