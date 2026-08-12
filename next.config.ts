import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    remotePatterns: [
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