import { prisma } from "@/lib/prisma";
import type { EventMemberContext } from "@/lib/services/eventAccess";

export interface TicketBuyerRow {
  id: number;
  ticketName: string;
  buyerName: string | null;
  business: string | null;
  paidAmount: string | null;
  purchasedOn: Date | null;
}

/** Read-only list of actual ticket purchases (find_event_ticket_purchased), joined with the
 * buyer's name and business. This is a cleaner counterpart to the "Setup Event Tickets" page —
 * legacy's event_ticket_buyers.php confusingly used this same name for the ticket-type editor;
 * here the two are kept as separate, correctly-named pages (Event Tickets vs Ticket Buyers). */
export async function getTicketBuyers(context: EventMemberContext): Promise<TicketBuyerRow[]> {
  if (context.role !== "organiser") return [];

  const purchases = await prisma.find_event_ticket_purchased.findMany({
    where: { event_id: context.eventId },
    orderBy: { purchased_on: "desc" },
    select: {
      id: true,
      name: true,
      paid_amount: true,
      purchased_on: true,
      buyer_user_id: true,
      buyer_listing_id: true,
    },
  });
  if (purchases.length === 0) return [];

  const userIds = [...new Set(purchases.map((p: any) => p.buyer_user_id).filter((v: any): v is number => !!v))];
  const listingIds = [...new Set(purchases.map((p: any) => p.buyer_listing_id).filter((v: any): v is number => !!v))];

  const [users, listings] = await Promise.all([
    userIds.length > 0
      ? prisma.find_users.findMany({ where: { id: { in: userIds } }, select: { id: true, user_first_name: true, user_last_name: true } })
      : [],
    listingIds.length > 0
      ? prisma.find_listings.findMany({ where: { id: { in: listingIds } }, select: { id: true, title: true } })
      : [],
  ]);
  const userNameById = new Map<any, any>(users.map((u: any) => [u.id, `${u.user_first_name ?? ""} ${u.user_last_name ?? ""}`.trim()]));
  const listingTitleById = new Map<any, any>(listings.map((l: any) => [l.id, l.title]));

  return purchases.map((p: any) => ({
    id: p.id,
    ticketName: p.name,
    buyerName: p.buyer_user_id ? userNameById.get(p.buyer_user_id) ?? null : null,
    business: p.buyer_listing_id ? listingTitleById.get(p.buyer_listing_id) ?? null : null,
    paidAmount: p.paid_amount !== null && p.paid_amount !== undefined ? String(p.paid_amount) : null,
    purchasedOn: p.purchased_on,
  }));
}
