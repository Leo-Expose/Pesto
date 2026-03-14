import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  webpack: (config) => {
    // Disable symlink resolution to reduce readlink calls on Windows
    config.resolve = config.resolve || {};
    config.resolve.symlinks = false;
    return config;
  },
};

export default nextConfig;
