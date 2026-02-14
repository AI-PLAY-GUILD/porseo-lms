import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

// Constant-time string comparison (same pattern as convex/users.ts)
function safeCompare(a: string, b: string): boolean {
    const len = Math.max(a.length, b.length);
    let result = a.length ^ b.length;
    for (let i = 0; i < len; i++) {
        result |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
    }
    return result === 0;
}

// ============================
// Idempotency: Check if event already processed
// ============================
export const checkZoomEventProcessed = query({
    args: {
        eventId: v.string(),
        secret: v.string(),
    },
    handler: async (ctx, args) => {
        if (!safeCompare(args.secret, process.env.CONVEX_INTERNAL_SECRET || "")) {
            throw new Error("Unauthorized: Invalid secret");
        }
        const existing = await ctx.db
            .query("processedZoomEvents")
            .withIndex("by_event_id", (q) => q.eq("eventId", args.eventId))
            .first();
        return !!existing;
    },
});

// ============================
// Idempotency: Mark event as processed
// ============================
export const markZoomEventProcessed = mutation({
    args: {
        eventId: v.string(),
        eventType: v.string(),
        secret: v.string(),
    },
    handler: async (ctx, args) => {
        if (!safeCompare(args.secret, process.env.CONVEX_INTERNAL_SECRET || "")) {
            throw new Error("Unauthorized: Invalid secret");
        }
        await ctx.db.insert("processedZoomEvents", {
            eventId: args.eventId,
            eventType: args.eventType,
            processedAt: Date.now(),
        });
    },
});

// ============================
// Create draft video from Zoom recording
// ============================
export const createZoomDraftVideo = mutation({
    args: {
        meetingId: v.string(),
        meetingTopic: v.string(),
        mp4DownloadUrl: v.string(),
        vttDownloadUrl: v.string(), // empty string if no VTT available
        recordingFileId: v.string(),
        duration: v.number(),
        eventId: v.string(),
        secret: v.string(),
    },
    handler: async (ctx, args) => {
        if (!safeCompare(args.secret, process.env.CONVEX_INTERNAL_SECRET || "")) {
            throw new Error("Unauthorized: Invalid secret");
        }

        // Duplicate check: same Zoom recording file ID
        const existing = await ctx.db
            .query("videos")
            .filter((q) => q.eq(q.field("zoomRecordingId"), args.recordingFileId))
            .first();
        if (existing) {
            return existing._id;
        }

        const title = `【Zoom】${args.meetingTopic}`.slice(0, 200);

        const videoId = await ctx.db.insert("videos", {
            title,
            description: `Zoom ミーティング (ID: ${args.meetingId}) のクラウドレコーディング`,
            isPublished: false,
            duration: Math.round(args.duration),
            zoomMeetingId: args.meetingId,
            zoomRecordingId: args.recordingFileId,
            source: "zoom",
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // Audit log (no userId for system-initiated action)
        await ctx.db.insert("auditLogs", {
            action: "video.create.zoom",
            targetType: "video",
            targetId: videoId,
            details: `Zoom recording: ${args.meetingTopic} (Meeting ID: ${args.meetingId})`,
            createdAt: Date.now(),
        });

        // Schedule async Mux ingestion
        await ctx.scheduler.runAfter(0, internal.zoomActions.ingestToMux, {
            videoId,
            mp4DownloadUrl: args.mp4DownloadUrl,
            vttDownloadUrl: args.vttDownloadUrl,
        });

        return videoId;
    },
});

// ============================
// Internal Mutations (called by zoomActions.ts)
// ============================
export const updateVideoMuxInfo = internalMutation({
    args: {
        videoId: v.id("videos"),
        muxAssetId: v.string(),
        muxPlaybackId: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.videoId, {
            muxAssetId: args.muxAssetId,
            muxPlaybackId: args.muxPlaybackId,
            updatedAt: Date.now(),
        });
    },
});

export const updateVideoTranscription = internalMutation({
    args: {
        videoId: v.id("videos"),
        transcription: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.videoId, {
            transcription: args.transcription,
            updatedAt: Date.now(),
        });
    },
});

export const updateVideoError = internalMutation({
    args: {
        videoId: v.id("videos"),
        error: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.videoId, {
            description: `[エラー] ${args.error}`,
            updatedAt: Date.now(),
        });
    },
});
