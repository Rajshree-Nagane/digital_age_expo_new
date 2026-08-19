/**
 * GENERATED FILE — do not edit by hand.
 *
 * Written by `scripts/download-external-images.ts` (phase: dedupe). Maps a
 * canonical mirror path produced by `legacyPathToLocalPath()` onto an image the
 * project ALREADY ships in `public/`, when the two turned out to be
 * byte-identical (same SHA-256). This is what keeps us from committing a second
 * copy of e.g. `tillu_white.png`.
 *
 * Regenerate with:
 *   npx tsx scripts/download-external-images.ts download
 *
 * An empty object is the correct state before the first run.
 */
export const ASSET_OVERRIDES: Record<string, string> = {
  "/images/external/apps/speaker_hall.png": "/images/speaker_hall.png",
  "/images/external/listing_pages/817601-27972070586_73eb8ef975_o (1).jpg": "/images/external/buy_ticket_banner1.jpg",
  "/images/external/listing_pages/817601-banner1.jpg": "/images/external/listing_pages/818073-dae_index_top_banner.jpg",
  "/images/external/listing_pages/817601-exhibitor.jpg": "/images/exhibitor.jpg",
  "/images/external/listing_pages/817601-exhibitor_2.jpg": "/images/exhibitor_2.jpg",
  "/images/external/listing_pages/817601-tillu_white.png": "/images/tillu_white.png",
  "/images/external/listing_pages/818073-exhibition.png": "/images/exhibition.png",
  "/images/external/lobby/event_47.mp4": "/images/event_47.mp4",
};
