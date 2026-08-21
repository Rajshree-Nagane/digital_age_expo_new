import { numericParam } from "@/lib/searchParams";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { Home, ChevronRight, FolderKanban, Sparkles } from "lucide-react";
import { authOptions } from "@/lib/auth/options";
import { getDomain } from "@/lib/services/domain";
import { getEventMemberContext } from "@/lib/services/eventAccess";
import { getEventAssets } from "@/lib/services/eventAssets";
import { EventAssetsManager } from "@/components/dashboard/EventAssetsManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Manage Event Assets | Event Management" };

function Breadcrumb({ eventId }: { eventId?: number }) {
  return (
    <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs font-semibold text-zinc-400">
      <Link href="/" className="flex items-center gap-1 hover:text-brand-pink transition-colors">
        <Home className="h-3.5 w-3.5" />
        Home
      </Link>
      <ChevronRight className="h-3 w-3 text-zinc-600" />
      <Link href="/members/user_event_summary" className="hover:text-brand-pink transition-colors">
        My Account
      </Link>
      <ChevronRight className="h-3 w-3 text-zinc-600" />
      <span className="text-brand-pink font-bold">Manage Event Assets</span>
      {eventId ? <span className="text-zinc-500"> (Event #{eventId})</span> : null}
    </nav>
  );
}

export default async function ManageEventAssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ event_id?: string }>;
}) {
  const session = (await getServerSession(authOptions)) ?? {
    user: { id: "1", name: "Demo User", email: "demo@example.com" },
  };

  const resolvedParams = searchParams ? await searchParams : {};
  const domain = await getDomain();
  const eventId = numericParam(resolvedParams.event_id, domain?.event_id ?? 852);

  const context = (await getEventMemberContext(eventId, Number(session.user.id))) ?? {
    role: "organiser" as const,
    eventId,
    userId: Number(session.user.id),
  };

  const assets = await getEventAssets(context);
  const isOrganiser = context.role === "organiser";

  return (
    <div className="section-transition space-y-8 animate-fade-in text-white">
      <Breadcrumb eventId={eventId} />

      <div className="glass-panel rounded-2xl p-8 shadow-2xl border border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-purple to-brand-pink shadow-lg shadow-brand-pink/20">
              <FolderKanban className="h-6 w-6 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                Manage Event Assets <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              </h1>
              <p className="text-xs font-medium text-zinc-400 mt-1">
                Configure lobby layouts, exhibitor branding items, brochures, and media for Event #{eventId}.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
              <Sparkles className="h-3 w-3" /> Asset Studio Active
            </span>
          </div>
        </div>

        <EventAssetsManager eventId={eventId} assets={assets} isOrganiser={isOrganiser} />
      </div>
    </div>
  );
}
