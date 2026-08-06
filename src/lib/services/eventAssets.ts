import { prisma } from "@/lib/prisma";
import type { EventMemberContext } from "@/lib/services/eventAccess";

export interface EventAssetItem {
  id: number;
  layoutId: number | null;
  title: string | null;
  assetType: string | null;
  assetUrl: string | null;
  assetAttachment: string | null;
  externalLink: string | null;
  businessName: string | null;
  isExhibitorAsset: boolean | null;
  isDefault: boolean | null;
  eventId: number;
  exhibitorUserId: number | null;
}

export async function getEventAssets(context: EventMemberContext): Promise<EventAssetItem[]> {
  const eventId = context.eventId;
  const isOrganiser = context.role === "organiser";

  const assets = await prisma.find_event_lobby_layout_type_assets.findMany({
    where: {
      event_id: eventId,
      ...(isOrganiser ? {} : { exhibitor_user_id: context.userId }),
    },
    orderBy: { id: "desc" },
    take: 100,
  });

  // Fetch users and listings for business name resolution.
  // find_users has no Prisma relation to find_listings (legacy tables, no declared FK), so the
  // listing has to be resolved as a separate lookup via primary_listing_id, same pattern as
  // exhibitors.ts's mapExhibitorRows.
  const userIds = Array.from(new Set(assets.map((a) => a.exhibitor_user_id).filter(Boolean))) as number[];
  const users = await prisma.find_users.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      user_first_name: true,
      user_last_name: true,
      primary_listing_id: true,
    },
  });

  const listingIds = Array.from(new Set(users.map((u) => u.primary_listing_id).filter(Boolean))) as number[];
  const listings =
    listingIds.length > 0
      ? await prisma.find_listings.findMany({
          where: { id: { in: listingIds } },
          select: { id: true, title: true },
        })
      : [];
  const listingById = new Map<number, { title: string }>(listings.map((l) => [l.id, l]));

  const userMap = new Map<number, { name: string; business: string }>();
  for (const u of users) {
    const name = `${u.user_first_name ?? ""} ${u.user_last_name ?? ""}`.trim();
    const listing = u.primary_listing_id ? listingById.get(u.primary_listing_id) : undefined;
    const business = listing?.title ?? "Business";
    userMap.set(u.id, { name, business });
  }

  return assets.map((a) => {
    const userInfo = a.exhibitor_user_id ? userMap.get(a.exhibitor_user_id) : null;
    const businessName = userInfo ? `${userInfo.name} (${userInfo.business})` : "Organiser Asset";

    return {
      id: a.id,
      layoutId: a.layout_id,
      title: a.title,
      assetType: a.asset_type,
      assetUrl: a.asset_url,
      assetAttachment: a.asset_attachment,
      externalLink: a.external_link,
      businessName,
      isExhibitorAsset: a.is_exhibitor_asset,
      isDefault: a.is_default,
      eventId: a.event_id,
      exhibitorUserId: a.exhibitor_user_id,
    };
  });
}
