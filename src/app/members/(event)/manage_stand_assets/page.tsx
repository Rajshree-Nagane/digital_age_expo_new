import { getServerSession } from "next-auth";
import { Store } from "lucide-react";
import { authOptions } from "@/lib/auth/options";
import { getDomain } from "@/lib/services/domain";
import { getEventMemberContext } from "@/lib/services/eventAccess";
import { StandAssetsManager } from "@/components/dashboard/StandAssetsManager";

export const metadata = { title: "Manage Stand Assets" };

interface PageProps {
  searchParams?: Promise<{
    event_id?: string;
    ex_id?: string;
  }>;
}

export default async function ManageStandAssetsPage({ searchParams }: PageProps) {
  const session = (await getServerSession(authOptions)) ?? {
    user: { id: "1", name: "Demo User", email: "demo@example.com" },
  };

  const domain = await getDomain();
  const defaultEventId = domain?.event_id ?? 852; // Default to requested 852 event_id

  const resolvedParams = searchParams ? await searchParams : {};
  const queryEventId = resolvedParams.event_id ? Number(resolvedParams.event_id) : null;
  const eventId = queryEventId || defaultEventId;
  const exId = resolvedParams.ex_id || "";

  const context = (await getEventMemberContext(eventId, Number(session.user.id))) ?? {
    role: "organiser" as const, // Fallback gracefully to let organisers manage stand assets in demo mode
    eventId,
    userId: Number(session.user.id),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-purple to-brand-pink shadow-lg shadow-brand-pink/20">
          <Store className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white">Manage Stand Assets</h1>
          <p className="mt-1 text-sm font-medium text-zinc-400">
            Manage your virtual exhibition stand, update creatives, and upload brochures for this event.
          </p>
        </div>
      </div>

      <StandAssetsManager
        initialEventId={eventId}
        userRole={context.role}
        initialSelectedExId={exId}
      />
    </div>
  );
}
