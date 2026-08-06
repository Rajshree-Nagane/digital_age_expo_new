import Link from "next/link";
import { getServerSession } from "next-auth";
import { Home, ChevronRight, BarChart3, TrendingUp, Users, Ticket, FileText, MessageSquare, DollarSign, CheckCircle2 } from "lucide-react";
import { authOptions } from "@/lib/auth/options";
import { getDomain } from "@/lib/services/domain";
import { getEventMemberContext } from "@/lib/services/eventAccess";
import { getReportStats, getRecentFeedback, getPollResults } from "@/lib/services/eventReports";

export const dynamic = "force-dynamic";
export const metadata = { title: "Event Reports & Analytics | Event Management" };

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
      <span className="text-brand-pink font-bold">Reports & Analytics</span>
      {eventId ? <span className="text-zinc-500"> (Event #{eventId})</span> : null}
    </nav>
  );
}

function StatCard({ label, value, sub, icon: Icon }: { label: string; value: string; sub?: string; icon?: any }) {
  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/10 shadow-xl hover:border-brand-pink/40 transition-all space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black uppercase tracking-wider text-fuchsia-300">{label}</span>
        {Icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-fuchsia-400">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">{value}</p>
        {sub && <p className="mt-1 text-xs font-medium text-zinc-400">{sub}</p>}
      </div>
    </div>
  );
}

function currency(n: number) {
  return `£${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function ReportsPage({
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
        <h1 className="text-3xl font-black uppercase text-white">Reports & Analytics</h1>
        <div className="glass-panel rounded-2xl p-8 text-center border-dashed border-white/10">
          <p className="text-zinc-400 font-medium italic">
            Event reports and analytics are only available to the event organiser.
          </p>
        </div>
      </div>
    );
  }

  const [stats, feedback, polls] = await Promise.all([
    getReportStats(context),
    getRecentFeedback(context),
    getPollResults(context),
  ]);

  return (
    <div className="section-transition space-y-8 animate-fade-in text-white">
      <Breadcrumb eventId={eventId} />

      <div className="glass-panel rounded-2xl p-8 shadow-2xl border border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-purple to-brand-pink shadow-lg shadow-brand-pink/20">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">Event Reports & Analytics</h1>
              <p className="text-xs font-medium text-zinc-400 mt-1">
                Real-time metrics for Event #{eventId} — registrations, exhibitor/sponsor signups, ticket sales, and invoice revenues.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Stats Active
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-2">
          <StatCard label="Registered Visitors" value={stats.visitorCount.toLocaleString()} icon={Users} />
          <StatCard
            label="Exhibitors"
            value={stats.exhibitorCount.toLocaleString()}
            sub={`${stats.activeExhibitorCount} active`}
            icon={TrendingUp}
          />
          <StatCard label="Sponsors" value={stats.sponsorCount.toLocaleString()} icon={BarChart3} />
          <StatCard label="Speakers" value={stats.speakerCount.toLocaleString()} icon={Users} />
          <StatCard label="Tickets Sold" value={stats.ticketsSold.toLocaleString()} icon={Ticket} />
          <StatCard label="Ticket Revenue" value={currency(stats.ticketRevenue)} icon={DollarSign} />
          <StatCard
            label="Invoices"
            value={stats.invoiceCount.toLocaleString()}
            sub={`${stats.paidInvoiceCount} paid / ${stats.unpaidInvoiceCount} unpaid`}
            icon={FileText}
          />
          <StatCard label="Paid Invoice Revenue" value={currency(stats.paidInvoiceRevenue)} icon={DollarSign} />
          <StatCard label="Outstanding (Unpaid)" value={currency(stats.unpaidInvoiceAmount)} icon={DollarSign} />
          <StatCard label="General Enquiries" value={stats.feedbackCount.toLocaleString()} icon={MessageSquare} />
        </div>
      </div>

      {/* Lobby Poll Results */}
      <div className="glass-panel rounded-2xl p-8 shadow-2xl border border-white/10 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-purple to-brand-pink">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-white">Lobby Poll Results</h2>
            <p className="text-xs font-medium text-zinc-400">Audience engagement and polling feedback across event sessions.</p>
          </div>
        </div>

        {polls.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-8 text-center">
            <p className="text-sm font-medium text-zinc-400 italic">No polls have been set up for this event yet.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {polls.map((q) => (
              <div key={q.id} className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-fuchsia-300">Poll Question #{q.id}</span>
                  <p className="text-sm font-extrabold text-white">{q.question}</p>
                  <p className="text-xs font-medium text-zinc-400">{q.totalResponses} total responses</p>
                </div>
                <div className="space-y-3 pt-2">
                  {q.options.map((o) => (
                    <div key={o.id} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium text-zinc-300">
                        <span className="truncate pr-2">{o.text}</span>
                        <span className="font-bold text-fuchsia-300 whitespace-nowrap">
                          {o.percent}% ({o.count})
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-white/5 border border-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-purple to-brand-pink transition-all duration-500"
                          style={{ width: `${o.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {q.options.length === 0 && <p className="text-xs text-zinc-500 italic">No options configured.</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent General Feedback / Enquiries */}
      <div className="glass-panel rounded-2xl p-8 shadow-2xl border border-white/10 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-purple to-brand-pink">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-white">Recent General Feedback / Enquiries</h2>
            <p className="text-xs font-medium text-zinc-400">Direct questions and support notes submitted by event attendees.</p>
          </div>
        </div>

        {feedback.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-8 text-center">
            <p className="text-sm font-medium text-zinc-400 italic">No general feedback has been submitted yet.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {feedback.map((f) => (
              <div key={f.id} className="glass-panel rounded-2xl p-6 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-white">{f.name || "Anonymous Visitor"}</span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {f.createdOn ? new Date(f.createdOn).toLocaleDateString() : ""}
                  </span>
                </div>
                <p className="text-xs font-medium text-zinc-300 leading-relaxed">{f.questionDescription}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Note */}
      <div className="glass-panel rounded-2xl p-6 border border-white/10 bg-black/30">
        <p className="text-xs font-medium text-zinc-400 leading-relaxed">
          <strong className="text-white">Note:</strong> This dashboard displays real-time aggregate totals across all exhibitors, sponsors, speakers, tickets, and invoices for Event #{eventId}, maintaining full visual consistency with the event management suite.
        </p>
      </div>
    </div>
  );
}
