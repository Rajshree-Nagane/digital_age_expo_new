import { prisma } from "@/lib/prisma";
import { assetUrl } from "@/lib/assets";

export interface GalleryItem {
  id: number;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  youtubeLink: string | null;
  isVideo: boolean;
}

/** Mirrors view_gallery.php: `find_organiser_image` rows for the event, excluding inactive ones. */
export async function getEventGallery(eventId: number): Promise<GalleryItem[]> {
  const rows = await prisma.find_organiser_image.findMany({
    where: { event_id: eventId, inactive: false },
    orderBy: { id: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      image: true,
      type: true,
      youtube_link: true,
    },
  });

  return rows.map((row: any) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    imageUrl: assetUrl(row.image ? `files/events/organiser_image/${row.image}` : null) ?? null,
    youtubeLink: row.youtube_link,
    isVideo: !!row.youtube_link || row.type === "video",
  }));
}
