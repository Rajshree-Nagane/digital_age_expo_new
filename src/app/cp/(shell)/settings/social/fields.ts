/**
 * Social Media field catalog — a 1:1 match to find_domains's Social Media columns, and the
 * same set the legacy admin form's "Social Media" fieldset exposes (facebook/instagram/
 * youtube/google/linkedin/twitter).
 */
export const SOCIAL_MEDIA_FIELDS = [
  { key: "facebook", label: "Facebook URL", type: "text" },
  { key: "instagram", label: "Instagram URL", type: "text" },
  { key: "youtube", label: "YouTube URL", type: "text" },
  // "google" is the legacy column name as-is — historically a Google+/Google Business profile
  // link, not a Google Analytics ID or API key; kept unchanged since that's what find_domains calls it.
  { key: "google", label: "Google (Profile / Business Link)", type: "text" },
  { key: "twitter", label: "Twitter / X URL", type: "text" },
  { key: "linkedin", label: "LinkedIn URL", type: "text" },
] as const;
