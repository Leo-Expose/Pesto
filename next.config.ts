import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  webpack: (config) => {
    // Persistent webpack cache is noisy on this Windows workspace and
    // regularly fails to snapshot dependencies without providing value.
    config.cache = false;

    // Disable symlink resolution to reduce readlink calls on Windows
    config.resolve = config.resolve || {};
    config.resolve.symlinks = false;
    return config;
  },
};

export default nextConfig;
