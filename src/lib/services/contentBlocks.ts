/**
 * Shared column selection for `find_listing_business_opportunity`.
 *
 * That table is the legacy CMS's generic "content block" store — it backs the About section, the
 * Book Your Stand block, the Why Exhibit / Why Join hero copy, the exhibitor package lists, and the
 * speaker page banners. It is 27 columns wide and it is read from 12 separate call sites across
 * home.ts, exhibitors.ts and speakers.ts, on some of the most-visited pages on the site.
 *
 * Every one of those call sites used to run with no `select` at all, so each fetched all 27 columns
 * — including the ones nothing reads. Auditing the consumers (the home page, /about, /why-exhibit,
 * /why_join_exhibit, /exhibitor-registration, /view_speaker and the components they render) shows
 * only four content fields are ever displayed:
 *
 *   section_title, section_description, additional_info, opportunity_images
 *
 * Notably NOT read anywhere: youtube_link, page_video, video, secondary_image, section_sub_title,
 * button_link, button_text, highlight_section_background, hide_section_title, domain_group,
 * trips_type, tripstype_price, linked_strategy_mstr_id, icon. (`icon` looks used at first glance,
 * but the `.icon` accesses in those pages are on locally-built objects that assign a Lucide
 * component during a `.map()` — not on the database row.)
 *
 * `opportunity_intro` and `domain_page_name` are also excluded: they appear only in `where` clauses,
 * which do not require the column to be selected.
 *
 * `sequence` IS kept, even though it is mostly an `orderBy` key, because
 * `getWhyJoinExhibitContent` reads it off the returned rows — `sequence === 0` is how that block
 * separates the section intro from the individual "reason" cards.
 *
 * `id` is kept because it is the natural React key for the list-shaped blocks.
 *
 * If a component genuinely needs one of the excluded columns, add it here rather than dropping the
 * `select` — one shared list is far easier to keep honest than 12 inline ones.
 */
export const CONTENT_BLOCK_SELECT = {
  id: true,
  sequence: true,
  section_title: true,
  section_description: true,
  additional_info: true,
  opportunity_images: true,
} as const;
