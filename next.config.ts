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
                    {
                        key: "Content-Security-Policy",
                        value: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.com https://clerk.aiplayguild.com https://challenges.cloudflare.com https://js.stripe.com https://stream.mux.com",
                            "style-src 'self' 'unsafe-inline'",
                            "img-src 'self' data: blob: https://image.mux.com https://*.convex.cloud https://img.clerk.com https://*.clerk.com https://pbs.twimg.com https://media.licdn.com",
                            "font-src 'self' data:",
                            "connect-src 'self' https://*.convex.cloud wss://*.convex.cloud https://*.clerk.accounts.dev https://*.clerk.com https://clerk.aiplayguild.com https://api.stripe.com https://stream.mux.com https://generativelanguage.googleapis.com",
                            "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://clerk.aiplayguild.com https://challenges.cloudflare.com https://js.stripe.com https://stream.mux.com",
                            "media-src 'self' blob: https://stream.mux.com https://*.mux.com",
                            "worker-src 'self' blob:",
                        ].join("; "),
                    },
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
