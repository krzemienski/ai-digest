import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@ai-digest/shared",
    "@ai-digest/db",
    "@ai-digest/email",
    "@ai-digest/podcast",
    "@ai-digest/agents",
  ],
  serverExternalPackages: [
    "fluent-ffmpeg",
    "@ffmpeg-installer/ffmpeg",
    "@aws-sdk/client-s3",
    "@anthropic-ai/sdk",
  ],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // fluent-ffmpeg has a conditional require('./lib-cov/fluent-ffmpeg')
      // for code coverage that webpack can't resolve. Ignore it.
      config.resolve = {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          "./lib-cov/fluent-ffmpeg": false,
        },
      };
    }
    return config;
  },
};

export default nextConfig;
