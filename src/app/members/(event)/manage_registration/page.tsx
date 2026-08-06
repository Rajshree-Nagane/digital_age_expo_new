import Link from "next/link";
import { getServerSession } from "next-auth";
import { Home, ChevronRight, Users, UserCheck, Settings, Download } from "lucide-react";
import { authOptions } from "@/lib/auth/options";
import { getDomain } from "@/lib/services/domain";
import { getEventMemberContext } from "@/lib/services/eventAccess";

export const dynamic = "force-dynamic";
export const metadata = { title: "Manage Registration | Event Management" };

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
      <span className="text-brand-pink font-bold">Manage Registration</span>
      {eventId ? <span className="text-zinc-500"> (Event #{eventId})</span> : null}
    </nav>
  );
}

export default async function ManageRegistrationPage({
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
        <h1 className="text-3xl font-black uppercase text-white">Manage Registration</h1>
        <div className="glass-panel rounded-2xl p-8 text-center border-dashed border-white/10">
          <p className="text-zinc-400 font-medium italic">
            Registration management is restricted to event organisers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="section-transition space-y-6 animate-fade-in">
      <Breadcrumb eventId={eventId} />

      <div className="glass-panel rounded-2xl p-8 shadow-2xl border border-white/10 text-white space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-purple to-brand-pink shadow-lg shadow-brand-pink/20">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-white">Registration Form & Settings</h1>
              <p className="text-xs font-medium text-zinc-400">
                Configure custom registration questions, badge fields, and attendee approval rules for Event #{eventId}.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-sophisticated flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white"
          >
            <Settings className="h-4 w-4" /> Form Customizer
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-3">
            <UserCheck className="h-6 w-6 text-brand-pink" />
            <h3 className="text-sm font-extrabold text-white uppercase">Approval Workflow</h3>
            <p className="text-xs text-zinc-300">Set automatic attendee approval or manual organiser review upon sign-up.</p>
          </div>
          <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-3">
            <Users className="h-6 w-6 text-fuchsia-400" />
            <h3 className="text-sm font-extrabold text-white uppercase">Custom Fields</h3>
            <p className="text-xs text-zinc-300">Add custom survey questions, dietary requirements, and company sizing tags.</p>
          </div>
          <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-3">
            <Download className="h-6 w-6 text-purple-400" />
            <h3 className="text-sm font-extrabold text-white uppercase">Data Export</h3>
            <p className="text-xs text-zinc-300">Download complete CSV reports of all registered attendees instantly.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
