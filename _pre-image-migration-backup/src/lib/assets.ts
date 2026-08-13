import { ASSETS_BASE_URL, PUBLIC_SITE_URL } from "@/lib/site-config";

/**
 * Uploaded media (speaker photos, sponsor logos, banners, opportunity images...)
 * still lives on the legacy PHP host's /files directory. We link to it directly
 * instead of duplicating the file store during the migration.
 */
export function assetUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${ASSETS_BASE_URL}${normalized}`;
}

/**
 * Exhibitor stand assets (banner creatives, gallery uploads, brochures) uploaded through
 * /api/members/stand-assets are written to this app's own public/images/lobby_assets folder and
 * always named `event_<id>_...`. Pre-existing/seeded stand assets migrated from the legacy site
 * only exist on the legacy host, so those filenames fall back to the legacy CDN instead (same
 * "lobby_assets" folder name, kept in sync with the local mirror on purpose).
 */
export function exhibitorAssetUrl(filename?: string | null): string | undefined {
  if (!filename) return undefined;
  if (filename.startsWith("http://") || filename.startsWith("https://")) return filename;
  if (filename.startsWith("event_")) return `/images/lobby_assets/${filename}`;
  return assetUrl(`files/lobby_assets/${filename}`);
}

/** Stand background templates (find_event_lobby_child_layout_manager.image /
 * find_event_template_color_options.image) live in the same legacy folder used for lobby zone
 * template images elsewhere in the app (see lib/services/eventZones.ts). */
export function standTemplateUrl(filename?: string | null): string | undefined {
  if (!filename) return undefined;
  if (filename.startsWith("http://") || filename.startsWith("https://")) return filename;
  return assetUrl(`files/lobby/child/${filename}`);
}

/**
 * The main lobby background (find_event_lobby_layout_manager.image — either an image or, when
 * the filename ends in .mp4/.webm, a looping background video) and the lobby's intro video
 * (video_path) both live in the legacy `files/lobby/` folder (lobby.php reads them from
 * `../files/lobby/<filename>` relative to itself, i.e. site-root `/files/lobby/<filename>`).
 */
export function lobbyAssetUrl(filename?: string | null): string | undefined {
  if (!filename) return undefined;
  if (filename.startsWith("http://") || filename.startsWith("https://")) return filename;
  return assetUrl(`files/lobby/${filename}`);
}

/** True when a lobby background filename should render as a <video> instead of an <img>. */
export function isLobbyVideoAsset(filename?: string | null): boolean {
  if (!filename) return false;
  return /\.(mp4|webm)$/i.test(filename);
}

/**
 * Footer/menu icons for the lobby's bottom nav (find_event_lobby_menu.icon_path) — organiser-
 * uploaded per menu row via the CP (see admin_lobby.php), so this deliberately does NOT fall
 * back to a bundled icon set: whatever image the organiser picked for "Auditorium" or a custom
 * menu item is what should render. lobby.php reads these from BASE_URL.'/files/lobby/lobby_menu/'.
 *
 * Deliberately resolved against PUBLIC_SITE_URL (the live site), not assetUrl()/ASSETS_BASE_URL
 * — a local XAMPP checkout of the legacy codebase has the PHP/template files but not the
 * multi-gigabyte uploaded `files/` media folder, so ASSETS_BASE_URL's localhost default 404s for
 * every icon. This is the same reason the lobby background video in
 * virtual-event/[slug]/page.tsx is hardcoded to the digitalageexpo.com URL instead of going
 * through lobbyAssetUrl().
 */
export function lobbyMenuIconUrl(filename?: string | null): string | undefined {
  if (!filename) return undefined;
  if (filename.startsWith("http://") || filename.startsWith("https://")) return filename;
  return `${PUBLIC_SITE_URL}/files/lobby/lobby_menu/${filename}`;
}

/**
 * A handful of the legacy lobby's footer icons (My Booth / Manage My Sessions) aren't per-event
 * DB rows at all — lobby.php hardcodes them as site-root-relative filenames
 * (`../images/lobby-booth.png`, `../images/lobby-mic-blank.png`). Used for the exhibitor/speaker
 * "extra" footer items this app adds on top of the DB-driven menu (see getExhibitorMenuExtras).
 * Resolved against PUBLIC_SITE_URL for the same reason as lobbyMenuIconUrl() above.
 */
export function lobbySiteImageUrl(filename: string): string {
  return `${PUBLIC_SITE_URL}/images/${filename}`;
}
