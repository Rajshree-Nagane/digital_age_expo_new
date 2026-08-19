import { prisma } from "@/lib/prisma";
import { CACHE_TAGS, cachedRead } from "@/lib/cache";
export type find_event_sponsorer_status = "approved" | "pending" | "unapproved";

/**
 * find_event_sponsorship_setup.price is a `Decimal(10,2)` column, and Prisma returns those as
 * `Decimal` class instances. Those cannot survive the read cache (see src/lib/cache.ts), so the
 * tier readers below hand back a plain string instead — the same approach eventTickets.ts already
 * takes for its own money columns in `toRow`.
 *
 * A string, specifically, and not a number: the pages render this as `£{tier.price.toLocaleString()}`,
 * and `String.prototype.toLocaleString` returns the string unchanged, so the rendered output is
 * byte-for-byte what it was before. Converting to a number would silently start inserting thousands
 * separators ("£5,000" where the site previously showed "£5000") — a visible change to live pages,
 * which is not something a caching fix should smuggle in.
 */
function withPriceAsString<T extends { price: unknown }>(row: T): Omit<T, "price"> & { price: string | null } {
  return { ...row, price: row.price != null ? String(row.price) : null };
}

/** Mirrors the sponsor query shared by sponsors.php, why-sponsor.php, and the home blocks. */
async function read_getApprovedSponsors(eventId: number) {
  const sponsors = await prisma.find_event_sponsorer.findMany({
    where: { event_id: eventId, is_approved: 1, status: "approved" },
    select: {
      id: true,
      listing_id: true,
      sponsor_type: true,
      sponsor_img: true,
    },
  });
  if (sponsors.length === 0) return [];

  const listingIds = [...new Set(sponsors.map((s: any) => s.listing_id).filter((id: any): id is number => !!id))];
  const [listings, sponsorTypes] = await Promise.all([
    prisma.find_listings.findMany({
      where: { id: { in: listingIds } },
      select: {
        id: true,
        title: true,
        friendly_url: true,
        logo_extension: true,
        description_short: true,
        primary_category_id: true,
      },
    }),
    prisma.independent_mst.findMany({
      where: { mstr_cd: { in: sponsors.map((s: any) => s.sponsor_type).filter((t: any): t is string => !!t) } },
      select: { mstr_cd: true, mstr_nm: true },
    }),
  ]);

  const listingById = new Map<any, any>(listings.map((l: any) => [l.id, l]));
  const typeNameByCode = new Map<any, any>(sponsorTypes.map((t: any) => [t.mstr_cd, t.mstr_nm]));

  return sponsors
    .map((sponsor: any) => {
      const listing = sponsor.listing_id ? listingById.get(sponsor.listing_id) : undefined;
      if (!listing) return null;
      return {
        id: sponsor.id,
        listingId: listing.id,
        title: listing.title,
        friendlyUrl: listing.friendly_url,
        logoExtension: listing.logo_extension,
        sponsorImage: sponsor.sponsor_img,
        descriptionShort: listing.description_short,
        sponsorTypeName: (sponsor.sponsor_type && typeNameByCode.get(sponsor.sponsor_type)) || "Sponsor",
      };
    })
    .filter((s: any): s is NonNullable<any> => s !== null);
}

/** Sponsorship packages/tiers for sale (find_event_sponsorship_setup), mirrors sponsors.php. */
async function read_getSponsorshipTiers(eventId: number) {
  const tiers = await prisma.find_event_sponsorship_setup.findMany({
    where: { event_id: eventId, active: true },
    orderBy: { display_order: "asc" },
    select: {
      id: true,
      title: true,
      short_description: true,
      price: true,
      available: true,
      used: true,
      sold_out: true,
      image: true,
    },
  });
  return tiers.filter((tier: any) => tier.available - tier.used >= 0).map(withPriceAsString);
}

async function read_getSponsorshipTierById(id: number) {
  const tier = await prisma.find_event_sponsorship_setup.findUnique({
    where: { id },
    select: {
      id: true,
      event_id: true,
      title: true,
      description: true,
      short_description: true,
      price: true,
      image: true,
      available: true,
      used: true,
      sold_out: true,
    },
  });
  if (!tier) return null;

  const benefitLinks = await prisma.find_sponsorship_option_benefits.findMany({
    where: { sponsorship_option_id: id },
    select: { benefit_id: true },
  });
  const benefitIds = benefitLinks.map((b: any) => b.benefit_id).filter((id: any): id is number => !!id);

  const benefits =
    benefitIds.length > 0
      ? await prisma.sponsorship_benefits.findMany({
          where: { id: { in: benefitIds } },
          orderBy: { sequence: "asc" },
          select: { id: true, benefit_title: true, description: true, benefit_type: true },
        })
      : [];

  const grouped = {
    before: benefits.filter((b: any) => b.benefit_type === "before_the_event"),
    during: benefits.filter((b: any) => b.benefit_type === "at_the_event"),
    after: benefits.filter((b: any) => b.benefit_type === "after_the_event"),
    standard: benefits.filter((b: any) => b.benefit_type === "standard_benefit"),
  };

  return { tier: withPriceAsString(tier), benefits: grouped };
}

export interface AdminSponsor {
  id: number;
  name: string | null;
  business: string | null;
  email: string | null;
  phone: string | null;
  sponsorType: string | null;
  status: find_event_sponsorer_status | null;
  isApproved: boolean;
  joiningStatus: string | null;
  date: Date | null;
}

/** Organiser-facing view of every sponsor registration for an event, regardless of approval state. */
export async function getSponsorsForAdmin(eventId: number): Promise<AdminSponsor[]> {
  const sponsors = await prisma.find_event_sponsorer.findMany({
    where: { event_id: eventId },
    orderBy: { id: "desc" },
    select: {
      id: true,
      name: true,
      business: true,
      email: true,
      phone: true,
      sponsor_type: true,
      status: true,
      is_approved: true,
      joining_status: true,
      date: true,
    },
  });

  return sponsors.map((sponsor: any) => ({
    id: sponsor.id,
    name: sponsor.name,
    business: sponsor.business,
    email: sponsor.email,
    phone: sponsor.phone,
    sponsorType: sponsor.sponsor_type,
    status: sponsor.status,
    isApproved: sponsor.is_approved === 1,
    joiningStatus: sponsor.joining_status,
    date: sponsor.date,
  }));
}

/** Mirrors the public query's `is_approved=1 AND status='approved'` gate — both flags move together. */
export async function updateSponsorApproval(id: number, decision: "approved" | "pending" | "unapproved") {
  const status: find_event_sponsorer_status =
    decision === "approved" ? "approved" : decision === "unapproved" ? "unapproved" : "pending";
  return prisma.find_event_sponsorer.update({
    where: { id },
    data: { status, is_approved: decision === "approved" ? 1 : 0 },
    select: { id: true },
  });
}

export async function deleteSponsorRegistration(id: number) {
  return prisma.find_event_sponsorer.delete({ where: { id }, select: { id: true } });
}
/**
 * ---------------------------------------------------------------------------
 *  Cached public reads
 * ---------------------------------------------------------------------------
 *
 *  See src/lib/cache.ts. The organiser-facing readers (`getSponsorsForAdmin`) and
 *  the approval/delete write paths are deliberately NOT cached: the first is
 *  behind a login and shows pending rows an editor is actively working through,
 *  and caching the second would be meaningless.
 */
export const getApprovedSponsors = cachedRead(["sponsors", "getApprovedSponsors"], read_getApprovedSponsors, {
  tags: [CACHE_TAGS.sponsors],
});
export const getSponsorshipTiers = cachedRead(["sponsors", "getSponsorshipTiers"], read_getSponsorshipTiers, {
  tags: [CACHE_TAGS.sponsors],
});
export const getSponsorshipTierById = cachedRead(["sponsors", "getSponsorshipTierById"], read_getSponsorshipTierById, {
  tags: [CACHE_TAGS.sponsors],
});
