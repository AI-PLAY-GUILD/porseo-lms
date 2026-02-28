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
            {
                protocol: "https",
                hostname: "pbs.twimg.com",
            },
            {
                protocol: "https",
                hostname: "media.licdn.com",
            },
        ],
        formats: ["image/avif", "image/webp"],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    },
    compress: true,
    poweredByHeader: false,
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    {
                        key: "X-Frame-Options",
                        value: "SAMEORIGIN",
                    },
                    // CSP temporarily disabled for debugging login button issue
                    {
                        key: "X-Content-Type-Options",
                        value: "nosniff",
                    },
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                    {
                        key: "Strict-Transport-Security",
                        value: "max-age=63072000; includeSubDomains; preload",
                    },
                    {
                        key: "Permissions-Policy",
                        value: "camera=(), microphone=(), geolocation=()",
                    },
                    {
                        key: "X-DNS-Prefetch-Control",
                        value: "on",
                    },
                ],
            },
        ];
    },
    logging: {
        fetches: {
            fullUrl: true,
        },
    },
    experimental: {
        optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
    },
};

export default nextConfig;
