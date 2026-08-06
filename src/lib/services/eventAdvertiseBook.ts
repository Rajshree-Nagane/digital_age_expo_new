import { prisma } from "@/lib/prisma";
import type { EventMemberContext } from "@/lib/services/eventAccess";
import type { EventAdvertiseBookInput } from "@/lib/validations/eventAdvertiseBook";

export interface AdvertiseBookOption {
  id: number;
  title: string;
}

/** The shared magazine-template catalog (find_advertise_books) an organiser can pick from
 * when booking this event into a magazine/advert book. status is a nullable Int in Prisma —
 * legacy treats 1 as "active"/published template. */
export async function getAdvertiseBookOptions(context: EventMemberContext): Promise<AdvertiseBookOption[]> {
  if (context.role !== "organiser") return [];
  const rows = await prisma.find_advertise_books.findMany({
    where: { status: 1 },
    select: { id: true, book_title: true },
    orderBy: { book_title: "asc" },
  });
  return rows.map((r: any) => ({ id: r.id, title: r.book_title ?? "" }));
}

export interface AdvertiseBookRow {
  id: number;
  bookId: number;
  bookTitle: string | null;
  title: string | null;
  publicationType: string | null;
  publicationTitleId: string | null;
  issueLink: string | null;
  status: string | null;
  isGenerated: boolean;
}

/** Mirrors members/event_advertise_book.php — the organiser's list of "which magazine + which
 * issue" this event is booked into. find_events_book has no Prisma relation to
 * find_advertise_books, so the template titles are merged in with a second query. */
export async function getAdvertiseBooks(context: EventMemberContext): Promise<AdvertiseBookRow[]> {
  if (context.role !== "organiser") return [];

  const rows = await prisma.find_events_book.findMany({
    where: { event_id: context.eventId },
    orderBy: { id: "desc" },
  });

  const bookIds = [...new Set(rows.map((r: any) => r.book_id).filter((v: any): v is number => !!v))];
  const books = bookIds.length > 0
    ? await prisma.find_advertise_books.findMany({ where: { id: { in: bookIds } }, select: { id: true, book_title: true } })
    : [];
  const bookTitleById = new Map<number, string | null>(books.map((b: any) => [b.id, b.book_title]));

  return rows.map((r: any) => ({
    id: r.id,
    bookId: r.book_id,
    bookTitle: bookTitleById.get(r.book_id) ?? null,
    title: r.title,
    publicationType: r.publication_type,
    publicationTitleId: r.publication_title_id,
    issueLink: r.issue_link,
    status: r.status,
    isGenerated: r.is_generated,
  }));
}

// find_events_book.publication_pdf is a NOT NULL column with no default, left over from the
// legacy PDF-generation flow that isn't part of this simplified CRUD. Filled with an inert
// empty string so `create` doesn't fail on the NOT NULL constraint.
const REQUIRED_LEGACY_DEFAULTS = {
  publication_pdf: "",
};

export async function createAdvertiseBook(context: EventMemberContext, input: EventAdvertiseBookInput) {
  if (context.role !== "organiser") return null;

  const bookId = Number(input.book_id);

  // Legacy PHP blocks booking the same magazine template into this event twice ("already
  // present" validation error). We keep that guard rather than silently allowing duplicates.
  const existing = await prisma.find_events_book.count({
    where: { event_id: context.eventId, book_id: bookId },
  });
  if (existing > 0) {
    return { duplicate: true as const };
  }

  const created = await prisma.find_events_book.create({
    data: {
      event_id: context.eventId,
      book_id: bookId,
      title: input.title || null,
      publication_type: input.publication_type || null,
      publication_title_id: input.publication_title_id || null,
      issue_link: input.issue_link || "",
      status: input.status,
      ...REQUIRED_LEGACY_DEFAULTS,
    },
    select: { id: true },
  });
  return { duplicate: false as const, id: created.id };
}

export async function updateAdvertiseBook(context: EventMemberContext, id: number, input: EventAdvertiseBookInput) {
  if (context.role !== "organiser") return { count: 0 };
  return prisma.find_events_book.updateMany({
    where: { id, event_id: context.eventId },
    data: {
      book_id: Number(input.book_id),
      title: input.title || null,
      publication_type: input.publication_type || null,
      publication_title_id: input.publication_title_id || null,
      issue_link: input.issue_link || "",
      status: input.status,
    },
  });
}

export async function deleteAdvertiseBook(context: EventMemberContext, id: number) {
  if (context.role !== "organiser") return { count: 0 };
  return prisma.find_events_book.deleteMany({ where: { id, event_id: context.eventId } });
}
