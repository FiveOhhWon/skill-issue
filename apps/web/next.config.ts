import type { NextConfig } from "next";

const distDir = process.env.NEXT_DIST_DIR?.trim();

const nextConfig: NextConfig = {
  distDir: distDir || ".next",
  transpilePackages: ["@skill-issue/shared"],
  serverExternalPackages: [
    "@anthropic-ai/claude-agent-sdk",
    "@skill-issue/skillkit",
  ],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Prevent webpack from bundling these server-only packages.
      // They'll be resolved by Node.js at runtime instead.
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        "@anthropic-ai/claude-agent-sdk",
        "@skill-issue/skillkit",
      ];
    }
    return config;
  },
};

export default nextConfig;
