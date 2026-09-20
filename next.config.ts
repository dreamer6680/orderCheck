import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  reactStrictMode:false,
  // LocatorJS runtime only provides the UI. This development-only transform
  // attaches the JSX source positions required to open the original file.
  // Do not apply it to node_modules or production builds.
  turbopack: {
    rules: {
      '*.tsx': {
        condition: {
          all: ['development', { not: 'foreign' }],
        },
        loaders: ['@locator/webpack-loader'],
      },
      '*.jsx': {
        condition: {
          all: ['development', { not: 'foreign' }],
        },
        loaders: ['@locator/webpack-loader'],
      },
    },
  },
};

export default nextConfig;
