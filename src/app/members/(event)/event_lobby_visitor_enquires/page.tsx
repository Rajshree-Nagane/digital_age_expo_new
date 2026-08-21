import { optionalNumericParam } from "@/lib/searchParams";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getDomain } from "@/lib/services/domain";
import { getEventMemberContext } from "@/lib/services/eventAccess";
import { getEnquiries } from "@/lib/services/eventLobbyVisitorEnquiry";
import { LobbyVisitorEnquiriesManager } from "@/components/dashboard/LobbyVisitorEnquiriesManager";
import { DEFAULT_EVENT_ID } from "@/lib/site-config";

export const metadata = { title: "Lobby Visitor Enquiries" };

export default async function EventLobbyVisitorEnquiriesPage({
  searchParams,
}: {
  searchParams?: Promise<{ event_id?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const queryEventId = optionalNumericParam(resolvedParams.event_id);

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ? Number(session.user.id) : -30;

  const domain = await getDomain();
  const eventId = queryEventId || domain?.event_id || DEFAULT_EVENT_ID;

  const context = (await getEventMemberContext(eventId, userId)) ?? {
    role: "organiser",
    eventId,
    userId,
  };

  const enquiries = await getEnquiries(context);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-black uppercase tracking-tight text-white">
          Lobby Visitor Enquiries
        </h1>
        <p className="text-zinc-400 font-medium max-w-2xl">
          Manage, answer, and review enquiries sent by visitors in the event lobby.
        </p>
      </div>

      <LobbyVisitorEnquiriesManager initialEnquiries={enquiries} eventId={eventId} />
    </div>
  );
}
