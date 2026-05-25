import withSerwistInit from "@serwist/next";
import { SECURITY_HEADERS } from "./lib/security/security-headers.mjs";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    const securityHeaders = Object.entries(SECURITY_HEADERS).map(([key, value]) => ({
      key,
      value,
    }));

    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/sw.js",
        headers: [
          ...securityHeaders,
          { key: "Service-Worker-Allowed", value: "/" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default withSerwist(nextConfig);
