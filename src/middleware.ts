import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// In-memory rate limiter (per-instance; for production consider @upstash/ratelimit with Redis)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute per IP

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    // Lazy cleanup: remove expired entries when map gets large
    if (rateLimitMap.size > 10000) {
        for (const [key, val] of rateLimitMap) {
            if (now > val.resetAt) rateLimitMap.delete(key);
        }
    }

    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
        return true;
    }

    entry.count++;
    return entry.count <= RATE_LIMIT_MAX_REQUESTS;
}

export default clerkMiddleware(async (_auth, request) => {
    // Rate limiting for API routes (exclude webhooks which have their own protection)
    if (
        request.nextUrl.pathname.startsWith("/api/") &&
        !request.nextUrl.pathname.startsWith("/api/webhooks/")
    ) {
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
            || request.headers.get("x-real-ip")
            || "unknown";

        if (!checkRateLimit(ip)) {
            return NextResponse.json(
                { error: "Too many requests" },
                { status: 429 }
            );
        }
    }

    // CSRF protection: validate Origin header on state-changing API requests.
    // Webhooks are excluded since they use signature verification.
    if (
        request.method === "POST" &&
        request.nextUrl.pathname.startsWith("/api/") &&
        !request.nextUrl.pathname.startsWith("/api/webhooks/")
    ) {
        const origin = request.headers.get("origin");
        if (origin) {
            const allowedOrigins = [
                process.env.NEXT_PUBLIC_BASE_URL,
                "http://localhost:3000",
            ].filter(Boolean);

            if (!allowedOrigins.includes(origin)) {
                return NextResponse.json(
                    { error: "Forbidden" },
                    { status: 403 }
                );
            }
        }
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
