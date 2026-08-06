import { prisma } from "@/lib/prisma";
import type { EventMemberContext } from "@/lib/services/eventAccess";

export interface EventPartnerItem {
  id: number;
  eventId: number;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  business: string | null;
  position: string | null;
  status: string;
  joiningStatus: string;
  isEnable: number;
  partnerLogo: string | null;
  date: Date | null;
}

export async function getEventPartners(
  context: EventMemberContext,
  filters?: { keyword?: string; filter?: string }
): Promise<{ partners: EventPartnerItem[]; counts: { total: number; registered: number; joined: number; pending: number } }> {
  const eventId = context.eventId;
  const isOrganiser = context.role === "organiser";

  const whereClause: any = { event_id: eventId };
  if (!isOrganiser) {
    whereClause.user_id = context.userId;
  }

  if (filters?.filter === "RegisterAccount") {
    whereClause.joining_status = "Joined";
  } else if (filters?.filter === "pendingAccount") {
    whereClause.joining_status = "Pending";
  } else if (filters?.filter === "registerExhibitor") {
    whereClause.user_id = { not: null };
  }

  if (filters?.keyword) {
    whereClause.OR = [
      { name: { contains: filters.keyword } },
      { business: { contains: filters.keyword } },
      { email: { contains: filters.keyword } },
      { phone: { contains: filters.keyword } },
    ];
  }

  const partners = await prisma.find_event_partner.findMany({
    where: whereClause,
    orderBy: { id: "desc" },
    take: 100,
  });

  const total = await prisma.find_event_partner.count({ where: { event_id: eventId } });
  const registered = await prisma.find_event_partner.count({
    where: { event_id: eventId, status: "active", user_id: { not: null } },
  });
  const joined = await prisma.find_event_partner.count({
    where: { event_id: eventId, joining_status: "Joined" },
  });
  const pending = await prisma.find_event_partner.count({
    where: { event_id: eventId, joining_status: "Pending" },
  });

  return {
    partners: partners.map((p) => ({
      id: p.id,
      eventId: p.event_id,
      name: p.name,
      firstName: p.first_name,
      lastName: p.last_name,
      phone: p.phone,
      email: p.email,
      business: p.business,
      position: p.position,
      status: p.status || "active",
      joiningStatus: p.joiningStatus || "Pending",
      isEnable: p.is_enable ?? 0,
      partnerLogo: p.partner_logo,
      date: p.date,
    })),
    counts: {
      total,
      registered,
      joined,
      pending,
    },
  };
}
