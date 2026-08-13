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
export const ASSET_OVERRIDES: Record<string, string> = {};
