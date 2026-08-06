import { prisma } from "@/lib/prisma";
import type { EventMemberContext } from "@/lib/services/eventAccess";

export interface EventMeetingRow {
  id: number;
  meetingDate: Date;
  meetingTime: string;
  exhibitorName: string | null;
  attendeeName: string | null;
}

/** Mirrors members/event_schedule_meeting.php's list view, scoped by the viewer's role. */
export async function getEventMeetings(context: EventMemberContext): Promise<EventMeetingRow[]> {
  const where =
    context.role === "organiser"
      ? { event_id: context.eventId }
      : context.role === "exhibitor"
        ? { event_id: context.eventId, exhibitor_id: context.exhibitorId ?? -1 }
        : { event_id: context.eventId, user_id: context.userId };

  const meetings = await prisma.find_event_schedule_meeting.findMany({
    where,
    orderBy: [{ meeting_date: "asc" }, { meeting_time: "asc" }],
    select: { id: true, meeting_date: true, meeting_time: true, exhibitor_id: true, user_id: true },
  });
  if (meetings.length === 0) return [];

  const exhibitorIds = [...new Set(meetings.map((m: any) => m.exhibitor_id).filter(Boolean))];
  const userIds = [...new Set(meetings.map((m: any) => m.user_id).filter(Boolean))];

  const [exhibitors, users] = await Promise.all([
    exhibitorIds.length > 0
      ? prisma.find_event_exhibitor.findMany({ where: { id: { in: exhibitorIds } }, select: { id: true, business: true, name: true } })
      : [],
    userIds.length > 0
      ? prisma.find_users.findMany({ where: { id: { in: userIds } }, select: { id: true, user_first_name: true, user_last_name: true } })
      : [],
  ]);

  const exhibitorById = new Map<any, any>(exhibitors.map((e: any) => [e.id, e.business || e.name]));
  const userById = new Map<any, any>(users.map((u: any) => [u.id, `${u.user_first_name ?? ""} ${u.user_last_name ?? ""}`.trim()]));

  return meetings.map((m: any) => ({
    id: m.id,
    meetingDate: m.meeting_date,
    meetingTime: m.meeting_time,
    exhibitorName: m.exhibitor_id ? exhibitorById.get(m.exhibitor_id) ?? null : null,
    attendeeName: m.user_id ? userById.get(m.user_id) ?? null : null,
  }));
}
