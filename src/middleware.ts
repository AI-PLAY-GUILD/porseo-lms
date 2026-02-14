import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (_auth, request) => {
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
