/** SEO field catalog — find_settings, grouptitle="seo". Entirely new: nothing in find_domains
 * or elsewhere already models meta/Open Graph/Twitter Card data for this site. */
export const SEO_TEXT_FIELDS = [
  { varname: "cp_seo_meta_title", label: "Meta Title", maxLength: 60 },
  { varname: "cp_seo_meta_description", label: "Meta Description", maxLength: 160, textarea: true },
  { varname: "cp_seo_meta_keywords", label: "Meta Keywords", maxLength: 255 },
  { varname: "cp_seo_canonical_url", label: "Canonical URL", maxLength: 255, isUrl: true },
  { varname: "cp_seo_og_title", label: "Open Graph Title", maxLength: 60 },
  { varname: "cp_seo_og_description", label: "Open Graph Description", maxLength: 160, textarea: true },
  { varname: "cp_seo_twitter_title", label: "Twitter / X Title", maxLength: 60 },
  { varname: "cp_seo_twitter_description", label: "Twitter / X Description", maxLength: 160, textarea: true },
] as const;

export const SEO_ROBOTS_OPTIONS = ["index, follow", "noindex, follow", "index, nofollow", "noindex, nofollow"] as const;

export const SEO_IMAGE_FIELDS = [
  { varname: "cp_seo_og_image", slot: "seo_og_image", label: "Open Graph Image", hint: "Shown when the site is shared on Facebook/LinkedIn. Recommended 1200×630." },
  { varname: "cp_seo_twitter_image", slot: "seo_twitter_image", label: "Twitter / X Image", hint: "Shown when the site is shared on X. Recommended 1200×675." },
] as const;
