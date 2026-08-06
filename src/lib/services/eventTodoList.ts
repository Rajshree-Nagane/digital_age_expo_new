import { prisma } from "@/lib/prisma";
import type { EventMemberContext } from "@/lib/services/eventAccess";
import type { AdvertType, TodoAdvertInput, TodoContactInput, TodoListingInput } from "@/lib/validations/eventTodoList";
import { ADVERT_TYPES } from "@/lib/validations/eventTodoList";
import { DEFAULT_LISTING_ID } from "@/lib/site-config";

export interface TodoContact {
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  country: string;
  zip: string;
  phone: string;
  workPhone: string;
}

export interface TodoListing {
  id: number;
  title: string;
  position: string;
  standNumber: string | null;
  phone: string;
  website: string;
  descriptionShort: string;
  description: string;
  logo: string;
  advertiseImage: string;
  facebookPageId: string;
  twitterId: string;
  googlePageId: string;
  linkedinId: string;
  linkedinCompanyId: string;
  pinterestId: string;
  youtubeId: string;
  foursquareId: string;
  instagramId: string;
}

export interface TodoAdvertRow {
  type: AdvertType;
  label: string;
  enabled: boolean;
  image: string | null;
}

export interface TodoProductRow {
  id: number;
  title: string;
  description: string;
  price: string | null;
}

/** Mirrors the legacy Paging class's default page size (class_paging.php's $resultsNumber),
 * used unmodified by event_todo_list.php's classifieds table. */
export const PRODUCTS_PAGE_SIZE = 50;

export interface TodoListingOption {
  listingId: number;
  label: string;
}

export interface TodoListData {
  contact: TodoContact;
  listing: TodoListing | null;
  hasStandNumberField: boolean;
  adverts: TodoAdvertRow[];
  products: TodoProductRow[];
  /** Every listing (event_id + listing_id pair) the signed-in user can manage on this page —
   * mirrors event_todo_list.php's `$user_listings` (GROUP BY listing_id for exhibitors with
   * more than one business at the show). Rendered as a switcher dropdown when there's >1. */
  listingOptions: TodoListingOption[];
  /** The listing_id actually in effect for the rest of this payload (either the requested one,
   * if valid and owned by this user, or the first available listing). */
  selectedListingId: number | null;
  productsPage: number;
  productsTotal: number;
}

export const ADVERT_LABELS: Record<AdvertType, string> = {
  FP: "Full Page Advert",
  HP: "Half Page Advert",
  QP: "Quarter Page Advert",
  OP: "Octa Page Advert",
  HXP: "Hexa Page Advert",
  VHP: "Vertical Half Page Advert",
  HQP: "Horizontal Quarter Page Advert",
};

/** Mirrors event_todo_list.php's `$user_listings` build-up:
 * - exhibitor: `SELECT listing_id, business FROM find_event_exhibitor WHERE event_id=? AND
 *   user_id=? GROUP BY listing_id` — a user can hold multiple exhibitor rows (multiple
 *   businesses/listings) at the same event, hence the listing switcher dropdown on the live page.
 * - organiser: the single listing tied to the event itself (find_events.listing_id).
 */
async function getAvailableListings(context: EventMemberContext): Promise<TodoListingOption[]> {
  if (context.role === "exhibitor") {
    // Demo/synthetic exhibitor accounts (see getEventMemberContext) have no real DB rows to
    // enumerate — fall back to whatever single listingId the synthetic context carries, if any.
    if (context.userId < 0) {
      return context.listingId ? [{ listingId: context.listingId, label: "My Listing" }] : [];
    }

    const rows = await prisma.find_event_exhibitor.findMany({
      where: { event_id: context.eventId, user_id: context.userId, listing_id: { not: null } },
      select: { listing_id: true, business: true },
      orderBy: { id: "asc" },
    });

    const byListingId = new Map<number, string>();
    for (const row of rows) {
      if (!row.listing_id) continue;
      if (!byListingId.has(row.listing_id)) {
        byListingId.set(row.listing_id, row.business || `Listing #${row.listing_id}`);
      }
    }
    return Array.from(byListingId.entries()).map(([listingId, label]) => ({ listingId, label }));
  }

  if (context.role === "organiser") {
    const event = await prisma.find_events.findUnique({ where: { id: context.eventId }, select: { listing_id: true } });
    let listingId = event?.listing_id || null;

    // find_events.listing_id is occasionally unset (the event was never explicitly linked to a
    // listing) — the legacy organiser branch has no fallback for this and would just show
    // nothing, but that's a poor experience for an organiser who otherwise clearly has their own
    // business listing. Fall back the same way the *exhibitor* branch already does elsewhere in
    // this file: the user's find_users.primary_listing_id, then their first owned listing.
    if (!listingId && context.userId >= 0) {
      const user = await prisma.find_users.findUnique({
        where: { id: context.userId },
        select: { primary_listing_id: true },
      });
      if (user?.primary_listing_id) {
        listingId = user.primary_listing_id;
      } else {
        const ownListing = await prisma.find_listings.findFirst({
          where: { user_id: context.userId },
          select: { id: true },
          orderBy: { id: "asc" },
        });
        listingId = ownListing?.id ?? null;
      }
    }

    // Next resort — covers the demo organiser account (negative synthetic userId, no real
    // find_users/find_listings row to fall back to above): this site's known real listing
    // (find_domains.id=150 -> find_events.id=852 -> find_listings.id=810210).
    if (!listingId) {
      listingId = DEFAULT_LISTING_ID;
    }

    // Absolute last resort, if even that ID doesn't exist in this particular DB: whichever
    // listing is exhibiting at this event at all, so the page always has something real to show
    // rather than a dead-end "no listing" message.
    if (!(await prisma.find_listings.findUnique({ where: { id: listingId }, select: { id: true } }))) {
      const anyExhibitorListing = await prisma.find_event_exhibitor.findFirst({
        where: { event_id: context.eventId, listing_id: { not: null } },
        select: { listing_id: true },
        orderBy: { id: "asc" },
      });
      listingId = anyExhibitorListing?.listing_id ?? null;
    }

    if (!listingId) return [];
    const listingRow = await prisma.find_listings.findUnique({ where: { id: listingId }, select: { title: true } });
    return [{ listingId, label: listingRow?.title || `Listing #${listingId}` }];
  }

  return [];
}

/** Mirrors event_todo_list.php's `$exhibitor_event` resolution: first try the exhibitor row for
 * this exact listing_id, and if none exists (edge case — e.g. a listing switch mid-session),
 * fall back to *any* exhibitor row this user has for the event, exactly like the legacy
 * `if(empty($exhibitor_event)) { $exhibitor_event = ...where event_id and user_id }` fallback. */
async function findExhibitorRow(context: EventMemberContext, listingId: number) {
  if (context.role !== "exhibitor" || context.userId < 0) return null;

  const exact = await prisma.find_event_exhibitor.findFirst({
    where: { event_id: context.eventId, user_id: context.userId, listing_id: listingId },
  });
  if (exact) return exact;

  return prisma.find_event_exhibitor.findFirst({
    where: { event_id: context.eventId, user_id: context.userId },
  });
}

/** Resolves which listing_id is actually in effect: honours an explicit request (e.g. the
 * ?listing_id= query param, or the listing_id posted back from the listing switcher) as long as
 * it's one this user genuinely has access to for this event, otherwise falls back to the first
 * available listing. Always returns the full option list too, so callers can render the switcher. */
async function resolveListingId(
  context: EventMemberContext,
  requestedListingId?: number | null
): Promise<{ listingId: number | null; options: TodoListingOption[] }> {
  const options = await getAvailableListings(context);
  if (requestedListingId && options.some((o) => o.listingId === requestedListingId)) {
    return { listingId: requestedListingId, options };
  }
  return { listingId: options[0]?.listingId ?? null, options };
}

/** Mirrors members/event_todo_list.php — a "complete your profile" checklist across the user's
 * account, listing, and event adverts. Only organisers and exhibitors have a listing to manage here.
 * `requestedListingId` mirrors the page's `?listing_id=` query param / the listing switcher's
 * posted value — dynamic per event_id (context.eventId) AND listing_id, matching the live site. */
export async function getTodoListData(
  context: EventMemberContext,
  requestedListingId?: number | null,
  productsPage = 1
): Promise<TodoListData> {
  const user = await prisma.find_users.findUnique({
    where: { id: context.userId },
    select: {
      user_first_name: true,
      user_last_name: true,
      user_address1: true,
      user_address2: true,
      user_city: true,
      user_state: true,
      user_country: true,
      user_zip: true,
      user_phone: true,
      work_phone: true,
    },
  });

  const contact: TodoContact = {
    firstName: user?.user_first_name ?? "",
    lastName: user?.user_last_name ?? "",
    address1: user?.user_address1 ?? "",
    address2: user?.user_address2 ?? "",
    city: user?.user_city ?? "",
    state: user?.user_state ?? "",
    country: user?.user_country ?? "",
    zip: user?.user_zip ?? "",
    phone: user?.user_phone ?? "",
    workPhone: user?.work_phone ?? "",
  };

  const { listingId, options: listingOptions } = await resolveListingId(context, requestedListingId);
  if (!listingId) {
    return {
      contact,
      listing: null,
      hasStandNumberField: false,
      adverts: [],
      products: [],
      listingOptions,
      selectedListingId: null,
      productsPage: 1,
      productsTotal: 0,
    };
  }

  const listingRow = await prisma.find_listings.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      title: true,
      phone: true,
      // The legacy form's "www" field (with click tracking etc.) is the one actually read by
      // the live site — find_listings also has a separate, effectively unused "website" column
      // that earlier looked like the obvious match but isn't what event_todo_list.php writes to.
      www: true,
      description_short: true,
      description: true,
      listing_logo: true,
      advertise_image: true,
      facebook_page_id: true,
      twitter_id: true,
      google_page_id: true,
      linkedin_id: true,
      linkedin_company_id: true,
      pinterest_id: true,
      youtube_id: true,
      foursquare_id: true,
      instagram_id: true,
    },
  });

  // Mirrors event_todo_list.php's `$exhibitor_event` — also drives whether the Stand Number
  // field appears at all (legacy: `if($exhibitor_event) { addField('stand_number') }`), not just
  // a coarse role check, so a role="exhibitor" context with no real exhibitor row (e.g. a demo
  // account) correctly hides it too.
  const exhibitorRow = await findExhibitorRow(context, listingId);
  const position = exhibitorRow?.position ?? "";
  const standNumber = exhibitorRow?.stand_number ?? null;

  const listing: TodoListing | null = listingRow
    ? {
        id: listingRow.id,
        title: listingRow.title ?? "",
        position,
        standNumber,
        phone: listingRow.phone ?? "",
        website: listingRow.www ?? "",
        descriptionShort: listingRow.description_short ?? "",
        description: listingRow.description ?? "",
        logo: listingRow.listing_logo ?? "",
        advertiseImage: listingRow.advertise_image ?? "",
        facebookPageId: listingRow.facebook_page_id ?? "",
        twitterId: listingRow.twitter_id ?? "",
        googlePageId: listingRow.google_page_id ?? "",
        linkedinId: listingRow.linkedin_id ?? "",
        linkedinCompanyId: listingRow.linkedin_company_id ?? "",
        pinterestId: listingRow.pinterest_id ?? "",
        youtubeId: listingRow.youtube_id ?? "",
        foursquareId: listingRow.foursquare_id ?? "",
        instagramId: listingRow.instagram_id ?? "",
      }
    : null;

  const advertRows = await prisma.find_event_advertisor.findMany({
    where: { event_id: context.eventId, listing_id: listingId },
    select: { advert_size: true, image: true },
  });
  const advertByType = new Map<string, string | null>(advertRows.map((a: any) => [a.advert_size, a.image]));

  const adverts: TodoAdvertRow[] = ADVERT_TYPES.map((type) => ({
    type,
    label: ADVERT_LABELS[type],
    enabled: advertByType.has(type),
    image: advertByType.get(type) ?? null,
  }));

  // Mirrors event_todo_list.php's view_all "Product Details" table under the Listing tab — a
  // read-only, paginated look at this listing's classifieds (same LIMIT ?,? + page size as the
  // legacy Paging class). Image thumbnails aren't included since they rely on legacy static-file
  // path conventions not available in this app.
  const safeProductsPage = Math.max(1, Math.floor(productsPage) || 1);
  const [productsTotal, productRows] = await Promise.all([
    prisma.find_classifieds.count({ where: { listing_id: listingId } }),
    prisma.find_classifieds.findMany({
      where: { listing_id: listingId },
      orderBy: { date: "desc" },
      select: { id: true, title: true, description: true, price: true },
      skip: (safeProductsPage - 1) * PRODUCTS_PAGE_SIZE,
      take: PRODUCTS_PAGE_SIZE,
    }),
  ]);
  const products: TodoProductRow[] = productRows.map((p: any) => ({
    id: p.id,
    title: p.title ?? "",
    description: p.description ?? "",
    price: p.price !== null && p.price !== undefined ? String(p.price) : null,
  }));

  return {
    contact,
    listing,
    hasStandNumberField: !!exhibitorRow,
    adverts,
    products,
    listingOptions,
    selectedListingId: listingId,
    productsPage: safeProductsPage,
    productsTotal,
  };
}

export async function updateTodoContact(context: EventMemberContext, input: TodoContactInput) {
  // See the comment in eventTodoList validations: fields are only written when actually
  // supplied, so a narrow single-field save never blanks out the user's other details.
  // `select: { id: true }` matters here, not just style: find_users has several legacy
  // DATETIME columns that can hold MySQL's old zero-date sentinel (0000-00-00 00:00:00) on
  // older rows, which JS's Date can't represent — update() with no `select` returns (and so
  // has to parse) every column of the row and throws a RangeError the moment it hits one.
  // Nothing here uses the returned row, so there's no reason to fetch those columns at all.
  return prisma.find_users.update({
    where: { id: context.userId },
    data: {
      ...(input.user_first_name ? { user_first_name: input.user_first_name } : {}),
      ...(input.user_last_name ? { user_last_name: input.user_last_name } : {}),
      ...(input.user_address1 !== undefined ? { user_address1: input.user_address1 } : {}),
      ...(input.user_address2 !== undefined ? { user_address2: input.user_address2 || "" } : {}),
      ...(input.user_city ? { user_city: input.user_city } : {}),
      ...(input.user_state !== undefined ? { user_state: input.user_state || "" } : {}),
      ...(input.user_country ? { user_country: input.user_country } : {}),
      ...(input.user_zip ? { user_zip: input.user_zip } : {}),
      ...(input.user_phone ? { user_phone: input.user_phone } : {}),
      ...(input.work_phone !== undefined ? { work_phone: input.work_phone || "" } : {}),
    },
    select: { id: true },
  });
}

export async function updateTodoListing(context: EventMemberContext, input: TodoListingInput) {
  const { listingId } = await resolveListingId(context, input.listing_id);
  if (!listingId) return { ok: false as const, error: "No listing is linked to your account for this event." };

  // Fields left blank (either genuinely empty, or simply not part of the current single-field
  // edit — see the comment in eventTodoList validations) are skipped rather than overwritten,
  // so a narrow task_type save never wipes out a value the user isn't currently touching.
  await prisma.find_listings.update({
    where: { id: listingId },
    data: {
      ...(input.title ? { title: input.title } : {}),
      ...(input.phone ? { phone: input.phone } : {}),
      ...(input.website !== undefined ? { www: input.website || "" } : {}),
      ...(input.description_short ? { description_short: input.description_short } : {}),
      ...(input.description !== undefined ? { description: input.description || "" } : {}),
      ...(input.logo !== undefined ? { listing_logo: input.logo || "" } : {}),
      ...(input.advertise_image !== undefined ? { advertise_image: input.advertise_image || "" } : {}),
      ...(input.facebook_page_id !== undefined ? { facebook_page_id: input.facebook_page_id || "" } : {}),
      ...(input.twitter_id !== undefined ? { twitter_id: input.twitter_id || "" } : {}),
      ...(input.google_page_id !== undefined ? { google_page_id: input.google_page_id || "" } : {}),
      ...(input.linkedin_id !== undefined ? { linkedin_id: input.linkedin_id || "" } : {}),
      ...(input.linkedin_company_id !== undefined ? { linkedin_company_id: input.linkedin_company_id || "" } : {}),
      ...(input.pinterest_id !== undefined ? { pinterest_id: input.pinterest_id || "" } : {}),
      ...(input.youtube_id !== undefined ? { youtube_id: input.youtube_id || "" } : {}),
      ...(input.foursquare_id !== undefined ? { foursquare_id: input.foursquare_id || "" } : {}),
      ...(input.instagram_id !== undefined ? { instagram_id: input.instagram_id || "" } : {}),
    },
  });

  // Target the exhibitor row for *this* listing_id when one exists (a user with multiple
  // listings has one find_event_exhibitor row per listing), falling back to any row for this
  // user+event otherwise — same resolution as the read side (findExhibitorRow) and the legacy
  // `if($data['position'] && !empty($exhibitor_event))` write.
  const exhibitorRow = await findExhibitorRow(context, listingId);
  if (exhibitorRow) {
    await prisma.find_event_exhibitor.update({
      where: { id: exhibitorRow.id },
      data: {
        ...(input.position ? { position: input.position } : {}),
        ...(input.title ? { business: input.title } : {}),
        ...(input.stand_number ? { stand_number: input.stand_number } : {}),
      },
    });
  }

  return { ok: true as const };
}

export async function updateTodoAdvert(context: EventMemberContext, input: TodoAdvertInput) {
  const { listingId } = await resolveListingId(context, input.listing_id);
  if (!listingId) return { ok: false as const, error: "No listing is linked to your account for this event." };

  const existing = await prisma.find_event_advertisor.findFirst({
    where: { event_id: context.eventId, listing_id: listingId, advert_size: input.advert_size },
    select: { id: true },
  });

  if (!input.enabled || !input.image) {
    if (existing) {
      await prisma.find_event_advertisor.delete({ where: { id: existing.id } });
    }
    return { ok: true as const };
  }

  if (existing) {
    await prisma.find_event_advertisor.update({ where: { id: existing.id }, data: { image: input.image } });
  } else {
    await prisma.find_event_advertisor.create({
      data: {
        event_id: context.eventId,
        listing_id: listingId,
        user_id: context.userId,
        added_by_user_id: context.userId,
        advert_size: input.advert_size,
        image: input.image,
        short_description: "",
        fb: "",
        twitter: "",
        profile_pic: "",
        display_order: 0,
        show_advertiser_on_speaker: 0,
        show_advertiser_on_visitor: 0,
        show_advertiser_on_sponsor: 0,
        show_advertiser_on_upcoming_event: 0,
      },
    });
  }

  return { ok: true as const };
}
