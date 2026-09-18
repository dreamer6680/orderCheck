import { withNextLocator } from "@next-locator/babel-plugin/dist/config.mjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

export default withNextLocator(nextConfig);