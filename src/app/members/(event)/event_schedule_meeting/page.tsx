import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getDomain } from "@/lib/services/domain";
import { getEventMemberContext } from "@/lib/services/eventAccess";
import { getEventMeetings } from "@/lib/services/eventMeetings";
import { getEventScheduleData } from "@/lib/services/eventSchedule";
import { EventScheduleMeetingClient } from "@/components/dashboard/EventScheduleMeetingClient";

export const metadata = { title: "Event Schedule & Meetings" };

interface PageProps {
  searchParams?: Promise<{ event_id?: string }>;
}

export default async function EventScheduleMeetingPage({ searchParams }: PageProps) {
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

  const scheduleData = await getEventScheduleData(eventId);
  const meetings = await getEventMeetings(context);

  return (
    <EventScheduleMeetingClient
      scheduleData={scheduleData}
      meetings={meetings}
      context={context}
    />
  );
}
