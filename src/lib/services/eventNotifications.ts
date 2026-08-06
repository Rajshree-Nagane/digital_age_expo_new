import { prisma } from "@/lib/prisma";
import type { EventMemberContext } from "@/lib/services/eventAccess";
import type { EventNotificationInput } from "@/lib/validations/eventNotification";

export interface EventNotificationRow {
  id: number;
  title: string;
  message: string;
  createdOn: Date;
  lobbyTitle: string | null;
  exhibitorName: string | null;
}

export interface NotificationLinkOption {
  id: number;
  label: string;
}

/** Mirrors event_notifications.php's list view — event-wide, visible to every member. */
export async function getEventNotifications(context: EventMemberContext): Promise<EventNotificationRow[]> {
  const notifications = await prisma.find_event_notifications.findMany({
    where: { event_id: context.eventId },
    orderBy: { created_on: "desc" },
    select: { id: true, title: true, message: true, created_on: true, layout: true, exhibitor: true },
  });
  if (notifications.length === 0) return [];

  const layoutIds = [...new Set(notifications.map((n: any) => n.layout).filter((v: any): v is number => !!v))];
  const exhibitorIds = [...new Set(notifications.map((n: any) => n.exhibitor).filter((v: any): v is number => !!v))];

  const [layouts, exhibitors] = await Promise.all([
    layoutIds.length > 0
      ? prisma.find_event_lobby_layout_manager.findMany({ where: { id: { in: layoutIds } }, select: { id: true, title: true } })
      : [],
    exhibitorIds.length > 0
      ? prisma.find_event_exhibitor.findMany({ where: { id: { in: exhibitorIds } }, select: { id: true, business: true, name: true } })
      : [],
  ]);
  const layoutTitleById = new Map<any, any>(layouts.map((l: any) => [l.id, l.title]));
  const exhibitorNameById = new Map<any, any>(exhibitors.map((e: any) => [e.id, e.business || e.name]));

  return notifications.map((n: any) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    createdOn: n.created_on,
    lobbyTitle: n.layout ? layoutTitleById.get(n.layout) ?? null : null,
    exhibitorName: n.exhibitor ? exhibitorNameById.get(n.exhibitor) ?? null : null,
  }));
}

/** Options for the "Visit Lobby" / "Visit Exhibitor Stand" deep-link selects on the send form. */
export async function getNotificationLinkOptions(context: EventMemberContext): Promise<{
  lobbies: NotificationLinkOption[];
  exhibitors: NotificationLinkOption[];
}> {
  const [lobbies, exhibitors] = await Promise.all([
    prisma.find_event_lobby_layout_manager.findMany({
      where: { event_id: context.eventId },
      select: { id: true, title: true },
      orderBy: { id: "asc" },
    }),
    prisma.find_event_exhibitor.findMany({
      where: { event_id: context.eventId },
      select: { id: true, business: true, name: true },
      orderBy: { id: "asc" },
    }),
  ]);

  return {
    lobbies: lobbies.map((l: any) => ({ id: l.id, label: l.title || `Lobby #${l.id}` })),
    exhibitors: exhibitors.map((e: any) => ({ id: e.id, label: e.business || e.name || `Exhibitor #${e.id}` })),
  };
}

/**
 * Mirrors event_notifications.php's action=add branch. Organiser-only: sending a push
 * notification is a broadcast action, not a per-member one. `url` is required by the
 * legacy schema but this app has no lobby/exhibitor deep-link builder, so it's set to "/".
 */
export async function createEventNotification(context: EventMemberContext, input: EventNotificationInput) {
  return prisma.find_event_notifications.create({
    data: {
      event_id: context.eventId,
      title: input.title,
      message: input.message,
      url: "/",
      layout: input.layout ?? null,
      exhibitor: input.exhibitor ?? null,
    },
    select: { id: true },
  });
}

/** Mirrors event_notifications.php's action=resend branch — duplicates the row with a fresh timestamp. */
export async function resendEventNotification(context: EventMemberContext, id: number) {
  const existing = await prisma.find_event_notifications.findFirst({
    where: { id, event_id: context.eventId },
  });
  if (!existing) return null;

  return prisma.find_event_notifications.create({
    data: {
      event_id: existing.event_id,
      title: existing.title,
      message: existing.message,
      url: existing.url,
      user_id: existing.user_id,
      layout: existing.layout,
      exhibitor: existing.exhibitor,
    },
    select: { id: true },
  });
}

export async function deleteEventNotification(context: EventMemberContext, id: number) {
  return prisma.find_event_notifications.deleteMany({ where: { id, event_id: context.eventId } });
}
