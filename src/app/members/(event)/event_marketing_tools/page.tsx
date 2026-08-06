import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getDomain } from "@/lib/services/domain";
import { getEventMemberContext } from "@/lib/services/eventAccess";
import { getMarketingTools } from "@/lib/services/eventMarketingTools";
import { MarketingToolsManager } from "@/components/dashboard/MarketingToolsManager";
import { DEFAULT_EVENT_ID } from "@/lib/site-config";

export const metadata = { title: "Marketing Tools" };

export default async function EventMarketingToolsPage({
  searchParams,
}: {
  searchParams?: Promise<{ event_id?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const queryEventId = resolvedParams.event_id ? Number(resolvedParams.event_id) : undefined;

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ? Number(session.user.id) : -30;

  const domain = await getDomain();
  const eventId = queryEventId || domain?.event_id || DEFAULT_EVENT_ID;

  const context = (await getEventMemberContext(eventId, userId)) ?? {
    role: "organiser",
    eventId,
    userId,
  };

  const marketingTools = await getMarketingTools(context);
  const canManage = context.role === "organiser";

  return (
    <div>
      <MarketingToolsManager
        data={marketingTools}
        canManage={canManage}
        eventId={eventId}
      />
    </div>
  );
}
