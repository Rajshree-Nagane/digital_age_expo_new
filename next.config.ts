import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    remotePatterns: [
      // Digital Age Expo
      {
        protocol: "https",
        hostname: "digitalageexpo.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.digitalageexpo.com",
        pathname: "/**",
      },

      // Apps Digital Age Expo
      {
        protocol: "https",
        hostname: "apps.digitalageexpo.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.apps.digitalageexpo.com",
        pathname: "/**",
      },

      // Tradeshow Local
      {
        protocol: "https",
        hostname: "tradeshowslocal.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.tradeshowslocal.com",
        pathname: "/**",
      },

      // Find Us On Web
      {
        protocol: "https",
        hostname: "findusonweb.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.findusonweb.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;