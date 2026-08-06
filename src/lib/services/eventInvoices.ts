import { prisma } from "@/lib/prisma";
import type { EventMemberContext } from "@/lib/services/eventAccess";

export interface EventInvoiceItem {
  id: number;
  orderId: number | null;
  orderNumber: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  businessName: string | null;
  type: string;
  amount: number;
  totalPayable: number;
  date: Date | null;
  status: string;
  used: boolean;
  paymentSubmitted: boolean;
  gatewayId: string | null;
  listingId: number | null;
  typeId: number | null;
}

export async function getEventInvoices(
  context: EventMemberContext,
  filters?: { keyword?: string; option?: string; orderType?: string }
): Promise<EventInvoiceItem[]> {
  const eventId = context.eventId;

  const invoices = await prisma.find_invoices.findMany({
    where: {
      event_id: eventId,
      ...(filters?.option === "paid" ? { status: "paid" } : {}),
      ...(filters?.option === "unpaid" ? { status: "unpaid" } : {}),
    },
    include: {
      find_orders: {
        include: {
          find_listings: true,
        },
      },
      find_users: true,
    },
    orderBy: { id: "desc" },
    take: 100,
  });

  return invoices.map((inv) => {
    const user = inv.find_users;
    const order = inv.find_orders;
    const listing = order?.find_listings;
    const name = user ? `${user.user_first_name ?? ""} ${user.user_last_name ?? ""}`.trim() : "Guest User";

    return {
      id: inv.id,
      orderId: inv.order_id,
      orderNumber: order?.order_id ?? `#${inv.id}`,
      name,
      email: user?.user_email ?? null,
      phone: user?.user_phone ?? null,
      businessName: listing?.title ?? inv.type ?? "Business",
      type: inv.type ?? "invoice",
      amount: Number(inv.subtotal ?? inv.total ?? 0),
      totalPayable: Number(order?.total_payable ?? inv.total ?? 0),
      date: inv.date,
      status: inv.status ?? "unpaid",
      used: Boolean(order?.used ?? false),
      paymentSubmitted: Boolean(inv.payment_submitted ?? false),
      gatewayId: inv.gateway_id,
      listingId: order?.order_listing_id ?? null,
      typeId: order?.type_id ?? null,
    };
  });
}
