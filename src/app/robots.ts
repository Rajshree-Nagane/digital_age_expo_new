import type { MetadataRoute } from "next";
import { PUBLIC_SITE_URL } from "@/lib/site-config";

/**
 * ===========================================================================
 *  CRAWLER RULES
 * ===========================================================================
 *
 *  This file did not exist before, and its absence was not harmless. With no
 *  `robots.ts` and no `public/robots.txt`, a request for `/robots.txt` fell
 *  through to the `[...slug]` catch-all — which answers arbitrary paths by
 *  running a `find_pages` lookup (twice: once in `generateMetadata`, once in
 *  the page body) and rendering a full HTML page. So the one file every crawler
 *  fetches first was itself two database queries and a server render, and every
 *  crawler then proceeded with no guidance at all.
 *
 *  Having a real robots.txt fixes that fetch and, more importantly, keeps bots
 *  out of the areas where crawling costs the most and gains nothing: the API
 *  surface, the admin control panel, and the logged-in member pages.
 *
 *  Deliberately NOT disallowed: the legacy directory URLs the catch-all serves
 *  (`/category/<industry>/location/<place>/...`). Those combine into a very
 *  large URL space and they are a real crawl cost, but whether they should stay
 *  indexed is an SEO decision about the legacy site's search footprint, not a
 *  performance one — see the note in sitemap.ts.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/", // no crawlable content, and some routes write
          "/cp/", // admin control panel
          "/members/", // logged-in exhibitor/organiser area
          "/dashboard/",
          "/account_onboarding/",
          "/login",
          "/speaker-questionaire", // one-off forms reached by direct link
          "/speaker_guest_registration",
        ],
      },
    ],
    sitemap: `${PUBLIC_SITE_URL}/sitemap.xml`,
    host: PUBLIC_SITE_URL,
  };
}
