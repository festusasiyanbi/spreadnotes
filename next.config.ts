import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["staging.localhost", "app.localhost"],
};

export default nextConfig;
