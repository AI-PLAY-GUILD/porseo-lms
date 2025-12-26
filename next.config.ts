import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.mux.com",
      },
      {
        protocol: "https",
        hostname: "ceaseless-capybara-653.convex.cloud",
      },
    ],
  },
};

export default nextConfig;
