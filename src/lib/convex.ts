import { ConvexHttpClient } from "convex/browser";

const convexUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
    throw new Error("CONVEX_URL or NEXT_PUBLIC_CONVEX_URL is missing. Please set it in your environment variables.");
}

export const convex = new ConvexHttpClient(convexUrl);
