import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "digitalageexpo.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "tradeshowslocal.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "findusonweb.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
