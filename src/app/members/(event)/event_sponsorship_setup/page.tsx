import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getDomain } from "@/lib/services/domain";
import { getEventMemberContext } from "@/lib/services/eventAccess";
import { getSponsorshipSetupRows, getSponsorshipSetupStats } from "@/lib/services/eventSponsorshipSetup";
import { EventSponsorshipSetupManager } from "@/components/dashboard/EventSponsorshipSetupManager";

export const metadata = { title: "Event Sponsorship Setup" };

interface PageProps {
  searchParams?: Promise<{ event_id?: string }>;
}

export default async function EventSponsorshipSetupPage({ searchParams }: PageProps) {
  const session = (await getServerSession(authOptions)) ?? {
    user: { id: "1", name: "Demo User", email: "demo@example.com" },
  };

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const domain = await getDomain();

  const eventId = resolvedSearchParams.event_id
    ? Number(resolvedSearchParams.event_id)
    : domain?.event_id ?? 1;

  const context = (await getEventMemberContext(eventId, Number(session.user.id))) ?? {
    role: "organiser" as const,
    eventId,
    userId: Number(session.user.id),
  };

  if (context.role !== "organiser") {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-px w-8 bg-brand-pink" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-pink">Restricted Access</p>
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tight text-white">Sponsorship Setup</h1>
        </div>
        <div className="glass-panel rounded-3xl p-12 text-center border-dashed border-white/10">
          <p className="text-zinc-400 font-medium italic">
            Sponsorship setup and tier configuration are restricted to event organisers.
          </p>
        </div>
      </div>
    );
  }

  const items = await getSponsorshipSetupRows(context.eventId);
  const stats = await getSponsorshipSetupStats(context.eventId);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-white/10 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-px w-8 bg-brand-pink" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-pink">Sponsorship Management</p>
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tight text-white">Sponsorship Setup</h1>
          <p className="text-zinc-400 font-medium max-w-2xl">
            Configure sponsorship tiers, availability, pricing, early bird discounts, and perks for this event.
          </p>
        </div>
        <div className="glass-panel px-6 py-3 rounded-full border-brand-pink/20 bg-white/5">
          <span className="text-sm font-black uppercase tracking-widest text-brand-pink">
            {stats.totalCount} {stats.totalCount === 1 ? "Tier" : "Tiers"}
          </span>
        </div>
      </div>

      <EventSponsorshipSetupManager initialItems={items} initialStats={stats} eventId={context.eventId} />
    </div>
  );
}
