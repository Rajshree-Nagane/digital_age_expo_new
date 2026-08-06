import Link from "next/link";
import { getServerSession } from "next-auth";
import { Home, ChevronRight, BarChart3, Plus, CheckCircle2 } from "lucide-react";
import { authOptions } from "@/lib/auth/options";
import { getDomain } from "@/lib/services/domain";
import { getEventMemberContext } from "@/lib/services/eventAccess";
import { LobbySubNav } from "@/components/dashboard/LobbySubNav";

export const dynamic = "force-dynamic";
export const metadata = { title: "Live Polling & Q&A | Event Management" };

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
      <span className="text-brand-pink font-bold">Live Polling & Q&A</span>
      {eventId ? <span className="text-zinc-500"> (Event #{eventId})</span> : null}
    </nav>
  );
}

export default async function EventLobbyPollingPage({
  searchParams,
}: {
  searchParams: Promise<{ event_id?: string }>;
}) {
  const session = (await getServerSession(authOptions)) ?? {
    user: { id: "1", name: "Demo User", email: "demo@example.com" },
  };

  const resolvedParams = searchParams ? await searchParams : {};
  const domain = await getDomain();
  const eventId = resolvedParams.event_id ? Number(resolvedParams.event_id) : (domain?.event_id ?? 852);

  const context = (await getEventMemberContext(eventId, Number(session.user.id))) ?? {
    role: "organiser" as const,
    eventId,
    userId: Number(session.user.id),
  };

  if (context.role !== "organiser") {
    return (
      <div className="section-transition space-y-6">
        <Breadcrumb eventId={eventId} />
        <h1 className="text-3xl font-black uppercase text-white">Live Polling & Q&A</h1>
        <div className="glass-panel rounded-2xl p-8 text-center border-dashed border-white/10">
          <p className="text-zinc-400 font-medium italic">
            Live polling configuration is restricted to event organisers.
          </p>
        </div>
      </div>
    );
  }

  const samplePolls = [
    { id: 1, question: "Which track is most valuable to your organization today?", votes: 142, status: "Active" },
    { id: 2, question: "Rate your overall satisfaction with the keynote speakers.", votes: 98, status: "Closed" },
    { id: 3, question: "Would you attend our virtual expo next year?", votes: 215, status: "Scheduled" },
  ];

  return (
    <div className="section-transition space-y-6 animate-fade-in">
      <Breadcrumb eventId={eventId} />
      <LobbySubNav eventId={eventId} active="polling" />

      <div className="glass-panel rounded-2xl p-8 shadow-2xl border border-white/10 text-white space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-purple to-brand-pink shadow-lg shadow-brand-pink/20">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-white">Live Polling & Q&A Manager</h1>
              <p className="text-xs font-medium text-zinc-400">
                Create real-time attendee polls and audience engagement questions for Event #{eventId}.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-sophisticated flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white"
          >
            <Plus className="h-4 w-4" /> Create New Poll
          </button>
        </div>

        <div className="grid gap-4">
          {samplePolls.map((poll) => (
            <div key={poll.id} className="glass-panel rounded-2xl p-5 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-fuchsia-300">Poll #{poll.id}</span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                      poll.status === "Active"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-zinc-500/20 text-zinc-300 border border-zinc-500/30"
                    }`}
                  >
                    {poll.status}
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-white">{poll.question}</h3>
                <p className="text-xs text-zinc-400">{poll.votes} total votes registered</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-300 hover:bg-white/10 hover:text-white transition"
                >
                  Edit Poll
                </button>
                <button
                  type="button"
                  className="btn-sophisticated rounded-xl px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-white"
                >
                  View Results
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
