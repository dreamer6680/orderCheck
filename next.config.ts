import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {
    rules: {
      "**/*.{tsx,jsx}": {
        loaders: [{ loader: "@locator/webpack-loader", options: { env: "development" } }],
      },
    },
  },
};

export default nextConfig;
