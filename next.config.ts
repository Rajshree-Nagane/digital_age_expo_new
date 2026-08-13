import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    /**
     * -----------------------------------------------------------------------
     * INTENTIONALLY EMPTY — do not add the legacy hosts back.
     * -----------------------------------------------------------------------
     *
     * This used to allow-list digitalageexpo.com, apps.digitalageexpo.com,
     * tradeshowslocal.com and findusonweb.com so `next/image` could fetch and
     * optimise images from them at request time. That is exactly what made the
     * deployed site fragile: every render depended on those hosts being up,
     * reachable from Vercel, and serving a valid TLS certificate — and they
     * intermittently were not. Locally it looked fine only because
     * NEXT_PUBLIC_ASSETS_BASE_URL pointed at a XAMPP copy of the legacy site.
     *
     * All of that media now lives in this repo under `public/images/external/**`
     * (mirrored by `scripts/download-external-images.ts`) and is served by
     * Vercel itself, so no remote pattern is required:
     *
     *   public/images/external/apps/speaker_hall.png
     *     -> https://<your-domain>/images/external/apps/speaker_hall.png
     *
     * Only add an entry here for a genuinely external image source that cannot
     * reasonably be mirrored (a live third-party CDN, an avatar service...).
     * Add the specific hostname and pathname — never a wildcard domain.
     */
    remotePatterns: [],
  },
};

export default nextConfig;
