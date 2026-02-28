import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

// ============================
// Internal Mutations (called by videoSecurity action)
// ============================

export const updateSecurityScanStatus = internalMutation({
    args: {
        videoId: v.id("videos"),
        status: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.videoId, {
            securityScanStatus: args.status,
            updatedAt: Date.now(),
        });
    },
});

export const updateSecurityFindings = internalMutation({
    args: {
        videoId: v.id("videos"),
        status: v.string(),
        findings: v.array(
            v.object({
                timestamp: v.number(),
                severity: v.string(),
                type: v.string(),
                description: v.string(),
                detectedText: v.optional(v.string()),
            }),
        ),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.videoId, {
            securityScanStatus: args.status,
            securityFindings: args.findings,
            updatedAt: Date.now(),
        });
    },
});

// ============================
// Internal Query (for scan action to read video data)
// ============================

export const getVideoForScan = internalQuery({
    args: {
        videoId: v.id("videos"),
    },
    handler: async (ctx, args) => {
        const video = await ctx.db.get(args.videoId);
        if (!video) return null;
        return {
            muxPlaybackId: video.muxPlaybackId,
            duration: video.duration,
        };
    },
});
