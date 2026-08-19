import type { MetadataRoute } from "next";
import { PUBLIC_SITE_URL } from "@/lib/site-config";

/**
 * ===========================================================================
 *  SITEMAP
 * ===========================================================================
 *
 *  Deliberately a hand-maintained list of the site's public marketing routes,
 *  with NO database access.
 *
 *  That is the whole point. A sitemap that enumerated every exhibitor, speaker
 *  and CMS page would be queried by every crawler that fetches it, and would
 *  then hand those crawlers thousands of URLs to go and render — each of which
 *  costs its own queries. Building the sitemap from the database would make the
 *  data-transfer problem this change set exists to fix measurably worse, not
 *  better. See src/lib/cache.ts for the incident this is part of.
 *
 *  If per-entity URLs are wanted in the sitemap later, the right shape is
 *  `generateSitemaps()` with the entity queries wrapped in `cachedRead` and a
 *  long revalidate window — not a bare `findMany` in here.
 *
 *  Keep this list in sync by hand when a public route is added. It is short
 *  enough that that is realistic, and a missing entry costs only discoverability
 *  for that one page.
 */

/** Public routes worth advertising, roughly in order of importance. */
const ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1.0, changeFrequency: "daily" },
  { path: "/about", priority: 0.8, changeFrequency: "monthly" },
  { path: "/buy_tickets", priority: 0.9, changeFrequency: "weekly" },
  { path: "/free-ticket", priority: 0.9, changeFrequency: "weekly" },
  { path: "/event_schedule", priority: 0.8, changeFrequency: "weekly" },
  { path: "/exhibitors", priority: 0.8, changeFrequency: "weekly" },
  // The speaker directory lives at /view_speaker. `/speakers` is NOT a route — it only appears to
  // work because the `[...slug]` catch-all answers unknown paths with a 200 placeholder instead of
  // a 404, so listing it here would advertise a soft-404 to crawlers.
  { path: "/view_speaker", priority: 0.8, changeFrequency: "weekly" },
  { path: "/sponsors", priority: 0.7, changeFrequency: "weekly" },
  { path: "/why-exhibit", priority: 0.7, changeFrequency: "monthly" },
  { path: "/why-sponsor", priority: 0.7, changeFrequency: "monthly" },
  { path: "/exhibitor-registration", priority: 0.7, changeFrequency: "monthly" },
  { path: "/sponsor_registration", priority: 0.6, changeFrequency: "monthly" },
  { path: "/speaker_registration", priority: 0.6, changeFrequency: "monthly" },
  { path: "/exhibitor-information", priority: 0.6, changeFrequency: "monthly" },
  { path: "/sponsor_opportunity", priority: 0.6, changeFrequency: "monthly" },
  { path: "/membership_packages", priority: 0.6, changeFrequency: "monthly" },
  { path: "/magazine", priority: 0.6, changeFrequency: "monthly" },
  { path: "/networking", priority: 0.6, changeFrequency: "monthly" },
  { path: "/event_experience", priority: 0.5, changeFrequency: "monthly" },
  { path: "/event_features", priority: 0.5, changeFrequency: "monthly" },
  { path: "/event_zones", priority: 0.5, changeFrequency: "monthly" },
  { path: "/event-services", priority: 0.5, changeFrequency: "monthly" },
  { path: "/glimpse-of-the-show", priority: 0.5, changeFrequency: "monthly" },
  { path: "/keynote", priority: 0.5, changeFrequency: "monthly" },
  { path: "/masterclass", priority: 0.5, changeFrequency: "monthly" },
  { path: "/seminars", priority: 0.5, changeFrequency: "monthly" },
  { path: "/webinars", priority: 0.5, changeFrequency: "monthly" },
  { path: "/live-workshop", priority: 0.5, changeFrequency: "monthly" },
  { path: "/vip-lounge", priority: 0.5, changeFrequency: "monthly" },
  { path: "/frequently-asked-questions", priority: 0.5, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
  { path: "/enter-the-show", priority: 0.5, changeFrequency: "monthly" },
  { path: "/articles", priority: 0.5, changeFrequency: "weekly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  // One timestamp for the whole file: these are hand-listed routes, so there is no per-route
  // "last changed" signal to report, and inventing one per entry would be noise.
  const lastModified = new Date();

  return ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${PUBLIC_SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
