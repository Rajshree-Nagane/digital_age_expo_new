import { prisma } from "@/lib/prisma";

export type find_events_rsvp_status = "Pending" | "Invited" | "Registered" | "Checked In" | "Not Interested" | "Unable to attend" | "Excluded" | string;

export interface AdminVisitor {
  id: number;
  name: string | null;
  business: string | null;
  email: string | null;
  phone: string | null;
  referralCode: string | null;
  status: find_events_rsvp_status | null;
  joiningStatus: string | null;
  date: Date | null;
}

/** Organiser-facing view of every visitor (RSVP) registration for an event, mirrors
 * members/view_visitor.php's list but surfaced alongside the exhibitor/speaker/sponsor
 * admin tables under /dashboard/admin. Soft-deleted rows are excluded. */
export async function getVisitorsForAdmin(eventId: number): Promise<AdminVisitor[]> {
  const visitors = await prisma.find_events_rsvp.findMany({
    where: { event_id: eventId, is_deleted: 0 },
    orderBy: { id: "desc" },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      business: true,
      email: true,
      phone: true,
      referral_code: true,
      status: true,
      joining_status: true,
      date: true,
    },
  });

  return visitors.map((visitor: any) => ({
    id: visitor.id,
    name: [visitor.first_name, visitor.last_name].filter(Boolean).join(" ") || null,
    business: visitor.business,
    email: visitor.email,
    phone: visitor.phone,
    referralCode: visitor.referral_code,
    status: visitor.status,
    joiningStatus: visitor.joining_status,
    date: visitor.date,
  }));
}

export async function updateVisitorStatus(id: number, status: find_events_rsvp_status) {
  return prisma.find_events_rsvp.update({ where: { id }, data: { status }, select: { id: true } });
}

/** Mirrors the legacy soft-delete (`is_deleted=1`) rather than a hard row delete. */
export async function deleteVisitorRegistration(id: number) {
  return prisma.find_events_rsvp.update({ where: { id }, data: { is_deleted: 1 }, select: { id: true } });
}
