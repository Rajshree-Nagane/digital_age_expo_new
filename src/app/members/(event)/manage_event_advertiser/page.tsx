import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getDomain } from "@/lib/services/domain";
import { getEventMemberContext } from "@/lib/services/eventAccess";
import { getAdvertisers, getAdvertiserStats } from "@/lib/services/eventAdvertiser";
import { getExhibitorOptionsForEvent } from "@/lib/services/eventBannerStands";
import { AdvertisersManager } from "@/components/dashboard/AdvertisersManager";
import { DEFAULT_EVENT_ID } from "@/lib/site-config";

export const metadata = { title: "Manage Advertisers" };

export default async function ManageAdvertisersPage() {
  const session = (await getServerSession(authOptions)) ?? {
    user: { id: "1", name: "Demo User", email: "demo@example.com" },
  };

  const domain = await getDomain();
  const eventId = domain?.event_id ?? DEFAULT_EVENT_ID;

  const context = (await getEventMemberContext(eventId, Number(session.user.id))) ?? {
    role: "organiser" as const,
    eventId,
    userId: Number(session.user.id),
  };

  if (context.role !== "organiser") {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-black uppercase tracking-wider text-white">Manage Advertisers</h1>
        <p className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-8 text-zinc-400 backdrop-blur-md">
          Advertiser management is only available to the event organiser.
        </p>
      </div>
    );
  }

  const [advertisers, stats, exhibitors] = await Promise.all([
    getAdvertisers(context),
    getAdvertiserStats(context),
    getExhibitorOptionsForEvent(eventId),
  ]);

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-widest text-white drop-shadow-md">
            Manage Advertiser's
          </h1>
          <p className="mt-1 text-sm font-semibold text-zinc-400">
            Review adverts, assign rates and categories, manage approval status, flag and copy advertisers.
          </p>
        </div>
      </div>

      <AdvertisersManager
        initialAdvertisers={advertisers}
        initialStats={stats}
        exhibitors={exhibitors}
      />
    </div>
  );
}
