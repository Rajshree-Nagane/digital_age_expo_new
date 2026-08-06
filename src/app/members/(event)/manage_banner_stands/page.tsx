import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getDomain } from "@/lib/services/domain";
import { getEventMemberContext } from "@/lib/services/eventAccess";
import {
  getBannerStands,
  getBannerStandStats,
  getExhibitorOptionsForEvent,
} from "@/lib/services/eventBannerStands";
import { BannerStandsManager } from "@/components/dashboard/BannerStandsManager";
import { DEFAULT_EVENT_ID } from "@/lib/site-config";

export default async function ManageBannerStandsPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ? Number(session.user.id) : -30;

  const domain = await getDomain();
  const eventId = domain?.event_id ?? DEFAULT_EVENT_ID;

  const context = (await getEventMemberContext(eventId, userId)) ?? {
    role: "organiser",
    eventId,
    userId,
  };

  const [bannerStands, stats, exhibitors] = await Promise.all([
    getBannerStands(context),
    getBannerStandStats(context),
    getExhibitorOptionsForEvent(eventId),
  ]);

  return (
    <BannerStandsManager
      initialBannerStands={bannerStands}
      initialStats={stats}
      exhibitors={exhibitors}
      userRole={context.role}
    />
  );
}
