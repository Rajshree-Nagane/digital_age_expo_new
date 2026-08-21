import { numericParam } from "@/lib/searchParams";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { Home, ChevronRight, LayoutTemplate, Sparkles, CheckCircle2 } from "lucide-react";
import { authOptions } from "@/lib/auth/options";
import { getDomain } from "@/lib/services/domain";
import { getEventMemberContext } from "@/lib/services/eventAccess";
import { LobbySubNav } from "@/components/dashboard/LobbySubNav";

export const dynamic = "force-dynamic";
export const metadata = { title: "Lobby Templates | Event Management" };

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
      <span className="text-brand-pink font-bold">Lobby Templates</span>
      {eventId ? <span className="text-zinc-500"> (Event #{eventId})</span> : null}
    </nav>
  );
}

export default async function EventLobbyTemplatesPage({
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

  if (context.role !== "organiser") {
    return (
      <div className="section-transition space-y-6">
        <Breadcrumb eventId={eventId} />
        <h1 className="text-3xl font-black uppercase text-white">Lobby Templates</h1>
        <div className="glass-panel rounded-2xl p-8 text-center border-dashed border-white/10">
          <p className="text-zinc-400 font-medium italic">
            Lobby template configuration is restricted to event organisers.
          </p>
        </div>
      </div>
    );
  }

  const templates = [
    { id: "modern", name: "Cyberpunk & Neon Luxury", description: "Deep dark canvas with vibrant magenta and purple glow accents.", active: true },
    { id: "corporate", name: "Executive Conference", description: "Clean corporate blue and platinum slate aesthetic.", active: false },
    { id: "minimal", name: "Minimalist Light & Shadow", description: "High contrast clean typography with subtle monochrome styling.", active: false },
  ];

  return (
    <div className="section-transition space-y-6 animate-fade-in">
      <Breadcrumb eventId={eventId} />
      <LobbySubNav eventId={eventId} active="templates" />

      <div className="glass-panel rounded-2xl p-8 shadow-2xl border border-white/10 text-white space-y-6">
        <div className="flex items-center gap-4 border-b border-white/10 pb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-purple to-brand-pink shadow-lg shadow-brand-pink/20">
            <LayoutTemplate className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-white">Virtual Lobby Theme Templates</h1>
            <p className="text-xs font-medium text-zinc-400">
              Select pre-designed immersive visual themes and layouts for Event #{eventId}.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className={`glass-panel rounded-2xl p-6 border transition-all space-y-4 flex flex-col justify-between ${
                tpl.active ? "border-brand-pink shadow-lg shadow-brand-pink/20 bg-gradient-to-br from-purple-950/40 to-black/60" : "border-white/10"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-fuchsia-300">Template</span>
                  {tpl.active && (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <CheckCircle2 className="h-3 w-3" /> Active Theme
                    </span>
                  )}
                </div>
                <h3 className="text-base font-extrabold text-white">{tpl.name}</h3>
                <p className="text-xs text-zinc-300 leading-relaxed">{tpl.description}</p>
              </div>
              <button
                type="button"
                disabled={tpl.active}
                className={`w-full rounded-xl py-2.5 text-xs font-extrabold uppercase tracking-wider transition ${
                  tpl.active
                    ? "bg-white/10 text-zinc-400 cursor-not-allowed"
                    : "btn-sophisticated text-white"
                }`}
              >
                {tpl.active ? "Currently Active" : "Apply Template"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
