import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getDomain } from "@/lib/services/domain";
import { getEventMemberContext } from "@/lib/services/eventAccess";
import {
  getMagazineSetupRows,
  getMagazineSetupStats,
  getMagazineOptions,
} from "@/lib/services/eventMagazineSetup";
import { EventMagazineSetupManager } from "@/components/dashboard/EventMagazineSetupManager";

export const metadata = { title: "Manage Magazine Page Setup" };

interface PageProps {
  searchParams?: Promise<{ event_id?: string; keyword?: string }>;
}

export default async function EventMagazineSetupPage({ searchParams }: PageProps) {
  const session = (await getServerSession(authOptions)) ?? {
    user: { id: "1", name: "Demo User", email: "demo@example.com" },
  };

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const domain = await getDomain();

  const eventId = resolvedSearchParams.event_id
    ? Number(resolvedSearchParams.event_id)
    : domain?.event_id ?? 852;

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
          <h1 className="text-4xl font-black uppercase tracking-tight text-white">Magazine Page Setup</h1>
        </div>
        <div className="glass-panel rounded-3xl p-12 text-center border-dashed border-white/10">
          <p className="text-zinc-400 font-medium italic">
            Magazine page configuration is restricted to event organisers.
          </p>
        </div>
      </div>
    );
  }

  const initialItems = await getMagazineSetupRows(context.eventId, resolvedSearchParams.keyword);
  const initialStats = await getMagazineSetupStats(context.eventId);
  const initialOptions = await getMagazineOptions();

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-white/10 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-px w-8 bg-brand-pink" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-pink">Event Administration</p>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">
            Manage Magazine Page Setup
          </h1>
          <p className="text-zinc-400 font-medium max-w-2xl">
            Configure section names, advert sizes, available pages, used counts, and automated magazine page rate setup for Event #{context.eventId}.
          </p>
        </div>
      </div>

      <EventMagazineSetupManager
        initialItems={initialItems}
        initialStats={initialStats}
        initialOptions={initialOptions}
        eventId={context.eventId}
      />
    </div>
  );
}
