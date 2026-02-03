import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // Required for Netlify deployment
  },
  output: 'standalone', // Recommended for Netlify
};

export default nextConfig;
