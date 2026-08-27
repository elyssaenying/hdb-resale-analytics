import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingIncludes: {
    "/api/analytics": ["./data/processed/web_export.json"],
  },
};

export default nextConfig;
