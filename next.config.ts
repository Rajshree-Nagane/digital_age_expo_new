import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // `eslint` was removed from next.config in Next.js 16 (see
  // https://nextjs.org/docs/messages/invalid-next-config) — lint no longer runs as part of
  // `next build`/`next dev` at all, so there's nothing to "ignore" here anymore. If you want lint
  // enforced, run the ESLint CLI (`npx eslint .`) separately, e.g. in CI.
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
