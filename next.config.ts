import type { NextConfig } from "next";


const nextConfig: NextConfig = {
  turbopack: {},
  webpack: (config: any) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      module: false, // createRequire — server-only, keep out of client bundle
    };
    return config;
  },
};

export default nextConfig;
