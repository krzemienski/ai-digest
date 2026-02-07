import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@ai-digest/shared",
    "@ai-digest/db",
    "@ai-digest/email",
  ],
};

export default nextConfig;
