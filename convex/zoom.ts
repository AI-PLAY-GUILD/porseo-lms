import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { safeCompare } from "./lib/safeCompare";

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
// Create draft video from Zoom recording
// Combines video creation + idempotency mark in one atomic mutation (TOCTOU fix)
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

        // Atomic idempotency check + mark within the same mutation (prevents TOCTOU race)
        const alreadyProcessed = await ctx.db
            .query("processedZoomEvents")
            .withIndex("by_event_id", (q) => q.eq("eventId", args.eventId))
            .first();
        if (alreadyProcessed) {
            return null; // Already processed, skip
        }

        // Mark as processed immediately (within same transaction)
        await ctx.db.insert("processedZoomEvents", {
            eventId: args.eventId,
            eventType: "recording.completed",
            processedAt: Date.now(),
        });

        // Duplicate check: same Zoom recording file ID (using index)
        const existing = await ctx.db
            .query("videos")
            .withIndex("by_zoom_recording_id", (q) => q.eq("zoomRecordingId", args.recordingFileId))
            .first();
        if (existing) {
            return existing._id;
        }

        // Truncate topic for safety
        const safeTopic = args.meetingTopic.slice(0, 200);
        const title = `【Zoom】${safeTopic}`.slice(0, 200);

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
            details: `Zoom recording: ${safeTopic} (Meeting ID: ${args.meetingId})`.slice(0, 500),
            createdAt: Date.now(),
        });

        // Schedule async Mux ingestion
        // biome-ignore lint/suspicious/noExplicitAny: zoomActions module not yet in generated API types
        await ctx.scheduler.runAfter(0, (internal as any).zoomActions.ingestToMux, {
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
            description: `[エラー] ${args.error.slice(0, 200)}`,
            updatedAt: Date.now(),
        });
    },
});
