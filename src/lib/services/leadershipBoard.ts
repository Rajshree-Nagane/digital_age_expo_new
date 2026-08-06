import { prisma } from "@/lib/prisma";
import type { EventMemberContext } from "@/lib/services/eventAccess";
import {
  LEADERSHIP_BOARD_TYPES,
  LEADERSHIP_BOARD_TYPE_LABELS,
  type LeadershipBoardInput,
  type LeadershipBoardType,
} from "@/lib/validations/leadershipBoard";

const SELECT_FIELDS = {
  id: true,
  first_name: true,
  last_name: true,
  title: true,
  description: true,
  business: true,
  position: true,
  type: true,
  image: true,
  expiry_date: true,
  issue_date: true,
} as const;

export interface LeadershipBoardRow {
  id: number;
  firstName: string;
  lastName: string;
  title: string;
  description: string;
  business: string;
  position: string;
  type: LeadershipBoardType;
  typeLabel: string;
  image: string | null;
  expiryDate: string | null;
  issueDate: string | null;
}

function toRow(row: {
  id: number;
  first_name: string | null;
  last_name: string | null;
  title: string;
  description: string | null;
  business: string | null;
  position: string | null;
  type: string;
  image: string | null;
  expiry_date: Date | null;
  issue_date: Date | null;
}): LeadershipBoardRow {
  const type = (LEADERSHIP_BOARD_TYPES as readonly string[]).includes(row.type)
    ? (row.type as LeadershipBoardType)
    : "leadership_board";
  return {
    id: row.id,
    firstName: row.first_name ?? "",
    lastName: row.last_name ?? "",
    title: row.title,
    description: row.description ?? "",
    business: row.business ?? "",
    position: row.position ?? "",
    type,
    typeLabel: LEADERSHIP_BOARD_TYPE_LABELS[type],
    image: row.image ?? null,
    expiryDate: row.expiry_date ? row.expiry_date.toISOString() : null,
    issueDate: row.issue_date ? row.issue_date.toISOString() : null,
  };
}

/** Mirrors leadership_board.php's list query: owner-scoped by `user_id`, plus either
 * `listing_id` (exhibitor/sponsor "member" context) or `event_id` (organiser), and always
 * limited to the 3 feed types this page manages. Ordered newest-issued first. */
export async function getLeadershipBoardEntries(context: EventMemberContext): Promise<LeadershipBoardRow[]> {
  const where = {
    user_id: context.userId,
    type: { in: [...LEADERSHIP_BOARD_TYPES] },
    ...(context.listingId ? { listing_id: context.listingId } : { event_id: context.eventId }),
  };

  const rows = await prisma.find_feeds_external.findMany({
    where,
    select: SELECT_FIELDS,
    orderBy: { issue_date: "desc" },
  });
  return rows.map(toRow);
}

/** Mirrors the add branch: `limit=1`, `active=1`, issue/expiry default to "now" if left blank. */
export async function createLeadershipBoardEntry(context: EventMemberContext, input: LeadershipBoardInput) {
  const now = new Date();
  return prisma.find_feeds_external.create({
    data: {
      event_id: context.eventId,
      listing_id: context.listingId ?? null,
      user_id: context.userId,
      title: input.title,
      description: input.description || null,
      first_name: input.first_name || null,
      last_name: input.last_name || null,
      business: input.business || null,
      position: input.position || null,
      type: input.type,
      limit: 1,
      active: 1,
      issue_date: input.issue_date ? new Date(input.issue_date) : now,
      expiry_date: input.expiry_date ? new Date(input.expiry_date) : now,
      date_created: now,
    },
    select: { id: true },
  });
}

export async function updateLeadershipBoardEntry(
  context: EventMemberContext,
  id: number,
  input: LeadershipBoardInput
) {
  return prisma.find_feeds_external.updateMany({
    where: { id, user_id: context.userId },
    data: {
      title: input.title,
      description: input.description || null,
      first_name: input.first_name || null,
      last_name: input.last_name || null,
      business: input.business || null,
      position: input.position || null,
      type: input.type,
      issue_date: input.issue_date ? new Date(input.issue_date) : undefined,
      expiry_date: input.expiry_date ? new Date(input.expiry_date) : undefined,
    },
  });
}

export async function deleteLeadershipBoardEntry(context: EventMemberContext, id: number) {
  return prisma.find_feeds_external.deleteMany({ where: { id, user_id: context.userId } });
}

/** Mirrors the "Bulk Delete" checkbox-driven form (External_Feeds::deleteFeed). */
export async function bulkDeleteLeadershipBoardEntries(context: EventMemberContext, ids: number[]) {
  return prisma.find_feeds_external.deleteMany({ where: { id: { in: ids }, user_id: context.userId } });
}

export async function setLeadershipBoardImage(context: EventMemberContext, id: number, imageUrl: string) {
  return prisma.find_feeds_external.updateMany({
    where: { id, user_id: context.userId },
    data: { image: imageUrl },
  });
}
