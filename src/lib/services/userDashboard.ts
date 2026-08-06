import { prisma } from "@/lib/prisma";

/**
 * Mirrors members/user_index.php — the account-home page shown right after login. The legacy
 * controller runs ~18 independent queries against the signed-in user's own data; this service
 * ports each one to Prisma. None of these legacy tables have foreign keys, so Prisma's
 * introspection didn't generate relation fields between them — every "join" here is done
 * manually (fetch ids, batch-fetch the related rows, build a Map) rather than via `include`,
 * matching the pattern used by the rest of this codebase's services.
 */

export interface DashboardListing {
  id: number;
  title: string;
  friendlyUrl: string;
  status: string;
  completionPercent: number;
  productCount: number;
}

export interface DashboardAccount {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  organization: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zip: string;
  verified: boolean;
  accountType: string;
}

export interface DashboardFavorite {
  id: number;
  listingId: number;
  title: string;
  friendlyUrl: string;
}

export interface DashboardCreditTransaction {
  id: number;
  type: string;
  points: number;
  comment: string;
  date: string;
  runningBalance: number;
}

export interface DashboardCredits {
  total: number;
  used: number;
  balance: number;
  transactions: DashboardCreditTransaction[];
}

export interface DashboardSponsorship {
  id: number;
  eventTitle: string;
  sponsorshipType: string;
  date: string | null;
}

export interface DashboardPublication {
  id: number;
  bookTitle: string;
  eventTitle: string;
  issueLink: string;
}

export interface DashboardTodo {
  id: number;
  message: string;
  actionLabel: string;
}

export interface DashboardPromotion {
  id: number;
  title: string;
  listingId: number;
  listingTitle: string;
}

export interface DashboardEvent {
  id: number;
  title: string;
  friendlyUrl: string;
  dateStart: string;
}

export interface DashboardExhibition {
  id: number;
  eventId: number;
  eventTitle: string;
}

export interface DashboardEventVisit {
  id: number;
  eventId: number;
  eventTitle: string;
  friendlyUrl: string;
}

export interface DashboardReview {
  id: number;
  listingTitle: string;
  friendlyUrl: string;
  title: string;
  rating: number;
}

export interface DashboardSearch {
  id: number;
  keywords: string;
  date: string;
}

export interface DashboardInvoice {
  id: number;
  invoiceNumber: string;
  balance: number;
  dateDue: string | null;
}

export interface UserDashboardData {
  listings: DashboardListing[];
  account: DashboardAccount | null;
  favorites: DashboardFavorite[];
  credits: DashboardCredits;
  sponsorships: DashboardSponsorship[];
  allPublications: DashboardPublication[];
  myPublications: DashboardPublication[];
  todos: DashboardTodo[];
  promotions: DashboardPromotion[];
  upcomingDirectoryPublications: DashboardEvent[];
  pastDirectoryPublications: DashboardEvent[];
  upcomingEvents: DashboardEvent[];
  pastEvents: DashboardEvent[];
  exhibitions: DashboardExhibition[];
  eventVisits: DashboardEventVisit[];
  submittedReviews: DashboardReview[];
  receivedReviews: DashboardReview[];
  previousSearches: DashboardSearch[];
  dueInvoices: DashboardInvoice[];
}

function uniq<T>(values: (T | null | undefined)[]): T[] {
  return [...new Set(values.filter((v): v is T => v !== null && v !== undefined))];
}

/** find_events_categories_lookup has no primary key so Prisma can't generate a model delegate
 * for it (marked @@ignore in schema.prisma) — queried via $queryRaw instead. Category 17 is the
 * "publication" event type in the legacy category taxonomy. Falls back to an empty set (treating
 * every event as "not a publication") if raw SQL isn't available, e.g. against the mock client. */
async function getPublicationEventIds(): Promise<Set<number>> {
  try {
    const rows = await prisma.$queryRaw<{ event_id: number }[]>`
      SELECT event_id FROM find_events_categories_lookup WHERE category_id = 17
    `;
    return new Set(rows.map((r: any) => r.event_id));
  } catch {
    return new Set();
  }
}

function completionPercent(listing: Record<string, unknown>, hasProducts: boolean): number {
  const checks = [
    !!listing.title,
    !!listing.logo_extension,
    !!listing.description_short,
    !!listing.description,
    !!listing.keywords,
    !!listing.meta_title,
    !!listing.phone,
    !!listing.listing_address1,
    !!listing.location_id,
    !!listing.www,
    hasProducts,
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}

async function getEventTitleMap(eventIds: number[]): Promise<Map<number, { title: string; friendly_url: string; user_id: number | null }>> {
  if (eventIds.length === 0) return new Map();
  const rows = await prisma.find_events.findMany({
    where: { id: { in: eventIds } },
    select: { id: true, title: true, friendly_url: true, user_id: true },
  });
  return new Map(rows.map((r: any) => [r.id, r]));
}

export async function getUserDashboardData(userId: number): Promise<UserDashboardData> {
  const [
    listingMembers,
    account,
    favoriteRows,
    creditRows,
    sponsorerRows,
    myEvents,
    todoRows,
    exhibitorRows,
    rsvpRows,
    submittedReviewRows,
    ownListingIdsForReviews,
    searchRows,
    invoiceRows,
    publicationEventIds,
    publicationRows,
  ] = await Promise.all([
    prisma.find_listing_members.findMany({ where: { member_user_id: userId }, select: { user_id: true } }),
    prisma.find_users.findUnique({
      where: { id: userId },
      select: {
        user_first_name: true,
        user_last_name: true,
        user_email: true,
        user_phone: true,
        user_organization: true,
        user_address1: true,
        user_city: true,
        user_state: true,
        user_country: true,
        user_zip: true,
        email_verified: true,
        custom_10: true,
        custom_13: true,
        is_franchise_business: true,
      },
    }),
    prisma.find_favorites.findMany({ where: { user_id: userId }, take: 5 }),
    prisma.find_user_credits_transactions.findMany({ where: { user_id: userId }, orderBy: { id: "desc" }, take: 20 }),
    prisma.find_event_sponsorer.findMany({ where: { user_id: userId }, orderBy: { date: "desc" }, take: 10 }),
    prisma.find_events.findMany({
      where: { user_id: userId, listing_id: { not: 0 }, status: "active" },
      select: { id: true, title: true, friendly_url: true, date_start: true },
      orderBy: { date_start: "desc" },
      take: 30,
    }),
    prisma.find_todo_list.findMany({ where: { user_id: userId, status: "unsuccess" }, take: 10 }),
    prisma.find_event_exhibitor.findMany({ where: { user_id: userId }, orderBy: { id: "desc" }, take: 10 }),
    prisma.find_events_rsvp.findMany({ where: { user_id: userId }, orderBy: { id: "desc" }, take: 10 }),
    prisma.find_reviews.findMany({ where: { user_id: userId }, take: 5 }),
    prisma.find_listings.findMany({ where: { user_id: userId }, select: { id: true } }),
    prisma.find_search_log.findMany({ where: { user_id: userId, keywords: { not: "" } }, orderBy: { id: "desc" }, take: 8 }),
    prisma.find_invoices.findMany({ where: { user_id: userId, status: "unpaid" }, orderBy: { date_due: "asc" }, take: 5 }),
    getPublicationEventIds(),
    prisma.find_magazine_publications.findMany({ where: { publish: 1 }, orderBy: { id: "desc" }, take: 10 }),
  ]);

  const receivedReviewRows =
    ownListingIdsForReviews.length > 0
      ? await prisma.find_reviews.findMany({
          where: { listing_id: { in: ownListingIdsForReviews.map((l: any) => l.id) } },
          take: 5,
        })
      : [];

  // --- TODOs: batch-fetch the listings each pending task references, so messages can name them ---
  const todoListingIds = uniq(todoRows.map((t: any) => t.listing_id));
  const todoListings =
    todoListingIds.length > 0
      ? await prisma.find_listings.findMany({
          where: { id: { in: todoListingIds } },
          select: { id: true, title: true, description_short: true },
        })
      : [];
  const todoListingById = new Map<number, any>(todoListings.map((l: any) => [l.id, l]));

  // --- Business listings + per-listing product counts ---
  const listingOwnerIds = [userId, ...listingMembers.map((m: any) => m.user_id).filter((id: any): id is number => !!id)];
  const listingRows = await prisma.find_listings.findMany({
    where: { user_id: { in: listingOwnerIds } },
    orderBy: { date: "desc" },
    take: 10,
    select: {
      id: true,
      title: true,
      friendly_url: true,
      status: true,
      logo_extension: true,
      description_short: true,
      description: true,
      keywords: true,
      meta_title: true,
      phone: true,
      listing_address1: true,
      location_id: true,
      www: true,
    },
  });
  const listingIds = listingRows.map((l: any) => l.id);
  const productCounts =
    listingIds.length > 0
      ? await prisma.find_classifieds.groupBy({ by: ["listing_id"], where: { listing_id: { in: listingIds } }, _count: { id: true } })
      : [];
  const productCountByListing = new Map<number, number>(productCounts.map((p: any) => [p.listing_id, p._count.id]));
  const listings: DashboardListing[] = listingRows.map((l: any) => {
    const productCount = productCountByListing.get(l.id) ?? 0;
    return {
      id: l.id,
      title: l.title,
      friendlyUrl: l.friendly_url,
      status: l.status,
      completionPercent: completionPercent(l, productCount > 0),
      productCount,
    };
  });

  // --- Favorites: batch-fetch the favorited listings ---
  const favoriteListingIds = uniq(favoriteRows.map((f: any) => f.listing_id));
  const favoriteListings =
    favoriteListingIds.length > 0
      ? await prisma.find_listings.findMany({ where: { id: { in: favoriteListingIds } }, select: { id: true, title: true, friendly_url: true } })
      : [];
  const favoriteListingById = new Map<number, any>(favoriteListings.map((l: any) => [l.id, l]));

  // --- Latest promotions: per-owned-listing (listing titles come from listingRows — every
  // promotion's listing_id is drawn from that same listingIds set, so no extra query needed) ---
  const promotionRows =
    listingIds.length > 0
      ? await prisma.find_latest_promotion.findMany({ where: { listing_id: { in: listingIds } }, select: { id: true, title: true, listing_id: true }, take: 10 })
      : [];
  const listingTitleById = new Map<number, string>(listingRows.map((l: any) => [l.id, l.title]));

  // --- Shopping credit history: running balance computed client-side ---
  let runningBalance = 0;
  const orderedForBalance = [...creditRows].sort((a: any, b: any) => a.id - b.id);
  const balanceById = new Map<number, number>();
  for (const row of orderedForBalance) {
    const points = Number(row.points);
    runningBalance += row.type === "receive" ? points : -points;
    balanceById.set(row.id, runningBalance);
  }
  const total = creditRows.filter((r: any) => r.type === "receive").reduce((sum: number, r: any) => sum + Number(r.points), 0);
  const used = creditRows.filter((r: any) => r.type === "paid").reduce((sum: number, r: any) => sum + Number(r.points), 0);

  // --- Sponsorships, exhibitions, event visits: batch-fetch event titles ---
  const sponsorEventTitles = await getEventTitleMap(uniq(sponsorerRows.map((s: any) => s.event_id)));
  const exhibitorEventTitles = await getEventTitleMap(uniq(exhibitorRows.map((e: any) => e.event_id)));
  const rsvpEventTitles = await getEventTitleMap(uniq(rsvpRows.map((r: any) => r.event_id)));

  // --- Reviews: batch-fetch listings + ratings ---
  const reviewListingIds = uniq([...submittedReviewRows, ...receivedReviewRows].map((r: any) => r.listing_id));
  const reviewRatingIds = uniq([...submittedReviewRows, ...receivedReviewRows].map((r: any) => r.rating_id));
  const [reviewListings, reviewRatings] = await Promise.all([
    reviewListingIds.length > 0
      ? prisma.find_listings.findMany({ where: { id: { in: reviewListingIds } }, select: { id: true, title: true, friendly_url: true } })
      : Promise.resolve([]),
    reviewRatingIds.length > 0
      ? prisma.find_ratings.findMany({ where: { id: { in: reviewRatingIds } }, select: { id: true, rating: true } })
      : Promise.resolve([]),
  ]);
  const reviewListingById = new Map<number, any>(reviewListings.map((l: any) => [l.id, l]));
  const reviewRatingById = new Map<number, any>(reviewRatings.map((r: any) => [r.id, r]));
  function toReview(r: any): DashboardReview {
    const listing = r.listing_id ? reviewListingById.get(r.listing_id) : undefined;
    const rating = r.rating_id ? reviewRatingById.get(r.rating_id) : undefined;
    return {
      id: r.id,
      listingTitle: listing?.title ?? "",
      friendlyUrl: listing?.friendly_url ?? "",
      title: r.title,
      rating: rating?.rating ?? 0,
    };
  }

  // --- Due invoices: batch-fetch transactions to compute paid-so-far balance ---
  const invoiceIds = invoiceRows.map((i: any) => i.id);
  const transactionRows =
    invoiceIds.length > 0
      ? await prisma.find_transactions.findMany({ where: { invoice_id: { in: invoiceIds } }, select: { invoice_id: true, amount: true } })
      : [];
  const paidByInvoice = new Map<number, number>();
  for (const t of transactionRows as any[]) {
    paidByInvoice.set(t.invoice_id, (paidByInvoice.get(t.invoice_id) ?? 0) + Number(t.amount));
  }

  // --- Publications: find_magazine_publications -> find_events_book -> find_advertise_books, plus find_events for titles ---
  const pubBookIds = uniq(publicationRows.map((p: any) => p.event_book_id));
  const pubEventIds = uniq(publicationRows.map((p: any) => p.event_id));
  const [pubBookRows, pubEventRows] = await Promise.all([
    pubBookIds.length > 0
      ? prisma.find_events_book.findMany({ where: { id: { in: pubBookIds } }, select: { id: true, book_id: true, title: true } })
      : Promise.resolve([]),
    pubEventIds.length > 0
      ? prisma.find_events.findMany({ where: { id: { in: pubEventIds } }, select: { id: true, title: true, user_id: true } })
      : Promise.resolve([]),
  ]);
  const pubAdvertiseBookIds = uniq(pubBookRows.map((b: any) => b.book_id));
  const pubAdvertiseBookRows =
    pubAdvertiseBookIds.length > 0
      ? await prisma.find_advertise_books.findMany({ where: { id: { in: pubAdvertiseBookIds } }, select: { id: true, book_title: true } })
      : [];
  const pubBookById = new Map<number, any>(pubBookRows.map((b: any) => [b.id, b]));
  const pubAdvertiseBookById = new Map<number, any>(pubAdvertiseBookRows.map((b: any) => [b.id, b]));
  const pubEventById = new Map<number, any>(pubEventRows.map((e: any) => [e.id, e]));
  function toPublication(p: any): DashboardPublication {
    const book = pubBookById.get(p.event_book_id);
    const advertiseBook = book ? pubAdvertiseBookById.get(book.book_id) : undefined;
    const event = pubEventById.get(p.event_id);
    return {
      id: p.id,
      bookTitle: advertiseBook?.book_title ?? book?.title ?? "",
      eventTitle: event?.title ?? "",
      issueLink: p.issue_link,
    };
  }
  // "All Publications" (find_magazine_publications platform-wide, not scoped to this user) mirrors
  // the legacy `if ($is_franchise) { $magazines = ... }` gate — only franchise accounts see it.
  const isFranchise = !!(account as any)?.is_franchise_business;
  const allPublications = isFranchise ? publicationRows.map(toPublication) : [];
  const myPublications = publicationRows.filter((p: any) => pubEventById.get(p.event_id)?.user_id === userId).map(toPublication);

  // --- TODOs: mirrors the credit_id switch in user_index.php, naming the listing where relevant ---
  const todos: DashboardTodo[] = [];
  for (const t of todoRows as any[]) {
    const listing = t.listing_id ? todoListingById.get(t.listing_id) : undefined;
    const name = listing?.title ?? "your listing";
    switch (t.credit_id) {
      case 3:
        if (t.listing_id) todos.push({ id: t.id, message: `Add a logo for ${name}`, actionLabel: "Add Logo" });
        break;
      case 4:
        if (t.listing_id) todos.push({ id: t.id, message: `Add gallery images for ${name}`, actionLabel: "Add Images" });
        break;
      case 5:
        if (t.listing_id) todos.push({ id: t.id, message: `Verify and confirm meta fields for ${name}`, actionLabel: "Verify" });
        break;
      case 6:
        if (t.listing_id) todos.push({ id: t.id, message: `Verify social media links for ${name}`, actionLabel: "Verify" });
        break;
      case 14:
        if (t.listing_id) todos.push({ id: t.id, message: `Add products/services for ${name}`, actionLabel: "Add" });
        break;
      case 18:
        if (t.listing_id && !listing?.description_short) {
          todos.push({ id: t.id, message: `Add a description and keywords for ${name}`, actionLabel: "Verify" });
        }
        break;
      case 7:
        todos.push({ id: t.id, message: "Update your communication preference", actionLabel: "Update" });
        break;
      case 19:
        todos.push({ id: t.id, message: "Update your banking details", actionLabel: "Update" });
        break;
      case 8:
        todos.push({ id: t.id, message: "Set your billing address", actionLabel: "Set now" });
        break;
      case 9:
        todos.push({ id: t.id, message: "Verify your phone number", actionLabel: "Verify now" });
        break;
      case 10:
        todos.push({ id: t.id, message: "Set your security question", actionLabel: "Set now" });
        break;
      default:
        todos.push({ id: t.id, message: "Complete a pending profile task", actionLabel: "View" });
    }
  }

  // --- Events: split the user's own events into publication-type vs regular, then each of those
  // into upcoming/past (mirrors the four separate legacy queries: upcoming/past events x
  // upcoming/past directory publications) ---
  const now = new Date();
  const publicationEvents = myEvents.filter((e: any) => publicationEventIds.has(e.id));
  const nonPublicationEvents = myEvents.filter((e: any) => !publicationEventIds.has(e.id));
  const upcomingEvents = nonPublicationEvents.filter((e: any) => e.date_start >= now).reverse();
  const pastEvents = nonPublicationEvents.filter((e: any) => e.date_start < now);
  const upcomingDirectoryPublications = publicationEvents.filter((e: any) => e.date_start >= now).reverse();
  const pastDirectoryPublications = publicationEvents.filter((e: any) => e.date_start < now);

  return {
    listings,
    account: account
      ? {
          firstName: account.user_first_name,
          lastName: account.user_last_name,
          email: account.user_email,
          phone: account.user_phone,
          organization: account.user_organization,
          address: account.user_address1,
          city: account.user_city,
          state: account.user_state,
          country: account.user_country,
          zip: account.user_zip ?? "",
          verified: account.email_verified === 1 && account.custom_10 === "Verified",
          accountType: account.custom_13 || "Member",
        }
      : null,
    favorites: favoriteRows.map((f: any) => {
      const listing = favoriteListingById.get(f.listing_id);
      return { id: f.id, listingId: f.listing_id, title: listing?.title ?? "", friendlyUrl: listing?.friendly_url ?? "" };
    }),
    credits: {
      total,
      used,
      balance: total - used,
      transactions: creditRows.map((r: any) => ({
        id: r.id,
        type: r.type,
        points: Number(r.points),
        comment: r.comment,
        date: r.date.toISOString(),
        runningBalance: balanceById.get(r.id) ?? 0,
      })),
    },
    sponsorships: sponsorerRows.map((s: any) => ({
      id: s.id,
      eventTitle: s.event_id ? sponsorEventTitles.get(s.event_id)?.title ?? "" : "",
      sponsorshipType: (s.sponsorship_type || "").replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
      date: s.date ? s.date.toISOString() : null,
    })),
    allPublications,
    myPublications,
    todos,
    promotions: promotionRows.map((p: any) => ({
      id: p.id,
      title: p.title,
      listingId: p.listing_id,
      listingTitle: listingTitleById.get(p.listing_id) ?? "",
    })),
    upcomingDirectoryPublications: upcomingDirectoryPublications.map((e: any) => ({
      id: e.id,
      title: e.title,
      friendlyUrl: e.friendly_url,
      dateStart: e.date_start.toISOString(),
    })),
    pastDirectoryPublications: pastDirectoryPublications.map((e: any) => ({
      id: e.id,
      title: e.title,
      friendlyUrl: e.friendly_url,
      dateStart: e.date_start.toISOString(),
    })),
    upcomingEvents: upcomingEvents.map((e: any) => ({
      id: e.id,
      title: e.title,
      friendlyUrl: e.friendly_url,
      dateStart: e.date_start.toISOString(),
    })),
    pastEvents: pastEvents.map((e: any) => ({
      id: e.id,
      title: e.title,
      friendlyUrl: e.friendly_url,
      dateStart: e.date_start.toISOString(),
    })),
    exhibitions: exhibitorRows.map((e: any) => ({
      id: e.id,
      eventId: e.event_id,
      eventTitle: exhibitorEventTitles.get(e.event_id)?.title ?? "",
    })),
    eventVisits: rsvpRows.map((r: any) => ({
      id: r.id,
      eventId: r.event_id,
      eventTitle: rsvpEventTitles.get(r.event_id)?.title ?? "",
      friendlyUrl: rsvpEventTitles.get(r.event_id)?.friendly_url ?? "",
    })),
    submittedReviews: submittedReviewRows.map(toReview),
    receivedReviews: receivedReviewRows.map(toReview),
    previousSearches: searchRows.map((s: any) => ({ id: s.id, keywords: s.keywords, date: s.date.toISOString() })),
    dueInvoices: invoiceRows.map((inv: any) => ({
      id: inv.id,
      invoiceNumber: inv.invoice_number ?? String(inv.id),
      balance: Number(inv.total ?? 0) - (paidByInvoice.get(inv.id) ?? 0),
      dateDue: inv.date_due ? inv.date_due.toISOString() : null,
    })),
  };
}
