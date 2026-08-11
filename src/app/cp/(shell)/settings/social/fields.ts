/**
 * Social Media platform catalog. Five platforms (facebook/instagram/linkedin/twitter/youtube)
 * already have a real find_domains column for their URL — those are reused as-is. The other
 * three (TikTok/WhatsApp/Pinterest) have no legacy column, so their URL lives in find_settings
 * instead, the same "new setting" pattern used throughout this module. Enabled/order are new
 * for ALL eight platforms (find_domains never had that concept) — always find_settings.
 *
 * `google` (a legacy Google Business Profile link, not one of the requested 8 platforms) is
 * kept working on the page as its own separate legacy field, unrelated to this list — see
 * page.tsx / actions.ts.
 */
export const SOCIAL_PLATFORMS = [
  { key: "facebook", label: "Facebook", urlSource: "domain" },
  { key: "instagram", label: "Instagram", urlSource: "domain" },
  { key: "linkedin", label: "LinkedIn", urlSource: "domain" },
  { key: "twitter", label: "X / Twitter", urlSource: "domain" },
  { key: "youtube", label: "YouTube", urlSource: "domain" },
  { key: "tiktok", label: "TikTok", urlSource: "setting" },
  { key: "whatsapp", label: "WhatsApp", urlSource: "setting" },
  { key: "pinterest", label: "Pinterest", urlSource: "setting" },
] as const;

export type SocialPlatformKey = (typeof SOCIAL_PLATFORMS)[number]["key"];

export function urlFieldName(key: SocialPlatformKey): string {
  const platform = SOCIAL_PLATFORMS.find((p) => p.key === key)!;
  return platform.urlSource === "domain" ? key : `cp_social_${key}_url`;
}
export function enabledFieldName(key: SocialPlatformKey): string {
  return `cp_social_${key}_enabled`;
}
export function orderFieldName(key: SocialPlatformKey): string {
  return `cp_social_${key}_order`;
}
