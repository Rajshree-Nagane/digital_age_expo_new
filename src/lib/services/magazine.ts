import { prisma } from "@/lib/prisma";
import { CACHE_TAGS, cachedRead } from "@/lib/cache";
import { assetUrl } from "@/lib/assets";

/**
 * Legacy `generated_pdf`/`thumbnail` columns store full server filesystem paths
 * (e.g. "/home/site/public_html/files/magazine/xyz.pdf"). magazine.php rebuilds a
 * public URL by slicing the string at the "files" segment and prefixing BASE_URL.
 * Mirrors that same `explode('files', ...)` logic.
 */
function toPublicFileUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const marker = "files";
  const idx = path.indexOf(marker);
  if (idx === -1) return null;
  const suffix = path.slice(idx + marker.length);
  return assetUrl(`files${suffix}`) ?? null;
}

export interface MagazinePublication {
  id: number;
  eventId: number;
  status: string | null;
  pdfUrl: string | null;
  thumbnailUrl: string | null;
  issueLink: string | null;
}

/** Mirrors magazine.php: `Select * from find_magazine_publications mp where id=?`. */
async function read_getMagazinePublicationById(id: number): Promise<MagazinePublication | null> {
  const record = await prisma.find_magazine_publications.findUnique({
    where: { id },
    select: {
      id: true,
      event_id: true,
      status: true,
      generated_pdf: true,
      thumbnail: true,
      issue_link: true,
    },
  });

  if (!record) return null;

  return {
    id: record.id,
    eventId: record.event_id,
    status: record.status,
    pdfUrl: toPublicFileUrl(record.generated_pdf),
    thumbnailUrl: toPublicFileUrl(record.thumbnail),
    issueLink: record.issue_link,
  };
}

/** Falls back to the most recent published magazine for the event when no id is given. */
async function read_getLatestMagazinePublication(eventId: number): Promise<MagazinePublication | null> {
  const record = await prisma.find_magazine_publications.findFirst({
    where: { event_id: eventId, publish: 1 },
    orderBy: { id: "desc" },
    select: {
      id: true,
      event_id: true,
      status: true,
      generated_pdf: true,
      thumbnail: true,
      issue_link: true,
    },
  });

  if (!record) return null;

  return {
    id: record.id,
    eventId: record.event_id,
    status: record.status,
    pdfUrl: toPublicFileUrl(record.generated_pdf),
    thumbnailUrl: toPublicFileUrl(record.thumbnail),
    issueLink: record.issue_link,
  };
}

/**
 * ---------------------------------------------------------------------------
 *  Cached public reads
 * ---------------------------------------------------------------------------
 *
 *  These wrap the readers above so their results are reused across requests
 *  instead of re-queried on every page view — see src/lib/cache.ts for why that
 *  matters here and what is deliberately left uncached (anything per-user or
 *  organiser-facing, which in this file means the *ForAdmin readers and every
 *  update/delete path).
 */
export const getMagazinePublicationById = cachedRead(["magazine", "getMagazinePublicationById"], read_getMagazinePublicationById, {
  tags: [CACHE_TAGS.magazine],
});
export const getLatestMagazinePublication = cachedRead(["magazine", "getLatestMagazinePublication"], read_getLatestMagazinePublication, {
  tags: [CACHE_TAGS.magazine],
});
