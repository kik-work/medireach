import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Free-to-use photos (Unsplash License).
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default nextConfig;
