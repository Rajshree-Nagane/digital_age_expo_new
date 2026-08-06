import { prisma } from "@/lib/prisma";

export interface ResolvedStandSpot {
  id: number;
  title: string | null;
  x_coordinates: string | null;
  y_coordinates: string | null;
  width: string | null;
  height: string | null;
  dimension: string | null;
  spot_type: string | null;
  help_text: string | null;
  asset: any | null;
  gallery: any[];
}

export interface ResolvedStand {
  zoneName: string;
  standImage: string;
  spots: ResolvedStandSpot[];
}

/**
 * Resolves everything the stand canvas needs to render for one exhibitor row: zone name, the
 * background template image, and every hotspot + whatever asset/gallery currently fills it.
 * Shared by /api/members/stand-assets (the editor) and the public /virtual-directory/[slug]
 * viewer, so both render exactly the same stand from exactly the same logic.
 *
 * Every step degrades to a safe default instead of throwing — one bad row (a dangling zone id, a
 * missing template) must never blank out the rest of the stand.
 */
export async function resolveExhibitorStand(exhibitor: any, eventId: number): Promise<ResolvedStand> {
  let zoneName = "";
  try {
    if (exhibitor.exhibition_zone_id) {
      const zone = await prisma.find_event_lobby_child_layout_manager.findUnique({
        where: { id: exhibitor.exhibition_zone_id },
      });
      if (zone?.title) zoneName = zone.title;
    }
  } catch {
    // Zone lookup failing shouldn't block the rest of the stand.
  }

  let lobbyChild: any = null;
  try {
    const standLayoutId = exhibitor.ex_stand_layout_id;
    if (standLayoutId) {
      lobbyChild = await prisma.find_event_lobby_child_layout_manager.findUnique({
        where: { id: standLayoutId },
      });
    } else {
      const layout = await prisma.find_event_lobby_layout_manager.findFirst({
        where: { event_id: eventId },
      });
      if (layout) {
        lobbyChild = await prisma.find_event_lobby_child_layout_manager.findFirst({
          where: { layout_type: "exhibition_stand", event_layout_id: layout.id },
        });
      }
    }
  } catch {
    // Fall back to no template — the placeholder canvas still renders.
  }

  let standImage = "";
  try {
    // A custom-uploaded stand background (via the manage_stand_assets editor's "Change Stand
    // Background" control) always wins over the generic template — it's stored as an absolute
    // /images/lobby_assets/... path, so both the editor and the public viewer can use it as-is.
    if (exhibitor.stand_image_url) {
      standImage = exhibitor.stand_image_url;
    }
    if (!standImage && exhibitor.stand_color_id) {
      const colorOption = await prisma.find_event_template_color_options.findUnique({
        where: { id: exhibitor.stand_color_id },
      });
      if (colorOption?.image) standImage = colorOption.image;
    }
    if (!standImage && lobbyChild?.image) {
      standImage = lobbyChild.image;
    }
  } catch {
    // Leave standImage empty; the UI already has a placeholder for this.
  }

  let spots: ResolvedStandSpot[] = [];
  try {
    const rawSpots = lobbyChild
      ? await prisma.find_event_lobby_spots.findMany({
          where: { event_layout_child_id: lobbyChild.id },
        })
      : [];

    const exAssets = await prisma.find_event_lobby_layout_type_assets.findMany({
      where: { exhibition_stand_id: exhibitor.id, event_id: eventId },
    });

    spots = await Promise.all(
      rawSpots.map(async (spot: any) => {
        try {
          const asset = exAssets.find((a: any) => a.default_asset_id === spot.exhibitor_asset_id) || null;
          const gallery = asset
            ? await prisma.find_event_lobby_asset_gallery.findMany({
                where: { parent_asset_id: asset.id },
              })
            : [];
          return { ...spot, asset, gallery: gallery || [] };
        } catch {
          return { ...spot, asset: null, gallery: [] };
        }
      })
    );
  } catch {
    // No spots resolved — canvas still shows with just the background image.
  }

  return { zoneName, standImage, spots };
}

/** Public lookup for the read-only /virtual-directory/[slug] booth viewer. */
export async function getPublicExhibitorStand(friendlyUrl: string) {
  const exhibitor = await prisma.find_event_exhibitor.findFirst({
    where: { friendly_url: friendlyUrl },
  });
  if (!exhibitor) return null;

  const resolved = await resolveExhibitorStand(exhibitor, exhibitor.event_id);
  return { exhibitor, ...resolved };
}
