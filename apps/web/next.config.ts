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
  webpack: (config, { isServer, webpack }) => {
    if (isServer) {
      // fluent-ffmpeg has a conditional require('./lib-cov/fluent-ffmpeg')
      // for code coverage that webpack can't resolve. IgnorePlugin is more
      // robust than alias because it works regardless of pnpm store paths.
      config.plugins = [
        ...(config.plugins ?? []),
        new webpack.IgnorePlugin({
          resourceRegExp: /lib-cov/,
          contextRegExp: /fluent-ffmpeg/,
        }),
      ];
    }
    return config;
  },
};

export default nextConfig;
