import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, mutation, query } from "./_generated/server";
import { safeCompare } from "./lib/safeCompare";

// ============================
// Query: Get latest Zoom recording date
// ============================
export const getLatestZoomVideoDate = query({
    args: {
        secret: v.string(),
    },
    handler: async (ctx, args) => {
        if (!safeCompare(args.secret, process.env.CONVEX_INTERNAL_SECRET || "")) {
            throw new Error("Unauthorized: Invalid secret");
        }

        const latestZoomVideo = await ctx.db
            .query("videos")
            .filter((q) => q.eq(q.field("source"), "zoom"))
            .order("desc")
            .first();

        if (!latestZoomVideo) {
            return null;
        }

        return latestZoomVideo.createdAt;
    },
});

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
        chatDownloadUrl: v.optional(v.string()), // empty string if no chat available
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

        // 「非公開」タグを取得 or 作成
        let unpublishedTag = await ctx.db
            .query("tags")
            .withIndex("by_slug", (q) => q.eq("slug", "非公開"))
            .first();

        if (!unpublishedTag) {
            const tagId = await ctx.db.insert("tags", {
                name: "非公開",
                slug: "非公開",
                createdAt: Date.now(),
            });
            unpublishedTag = await ctx.db.get(tagId);
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
            tags: unpublishedTag ? [unpublishedTag._id] : [],
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

        // Schedule async Mux ingestion (with chat download URL)
        // biome-ignore lint/suspicious/noExplicitAny: zoomActions module not yet in generated API types
        await ctx.scheduler.runAfter(0, (internal as any).zoomActions.ingestToMux, {
            videoId,
            mp4DownloadUrl: args.mp4DownloadUrl,
            vttDownloadUrl: args.vttDownloadUrl,
            chatDownloadUrl: args.chatDownloadUrl || "",
        });

        return videoId;
    },
});

// ============================
// Query: Check if Zoom meeting is already registered
// ============================
export const isZoomMeetingImported = query({
    args: {
        meetingId: v.string(),
        secret: v.string(),
    },
    handler: async (ctx, args) => {
        if (!safeCompare(args.secret, process.env.CONVEX_INTERNAL_SECRET || "")) {
            throw new Error("Unauthorized: Invalid secret");
        }

        const existing = await ctx.db
            .query("videos")
            .filter((q) => q.eq(q.field("zoomMeetingId"), args.meetingId))
            .first();
        return !!existing;
    },
});

// ============================
// Manual import: Create video from Zoom recording URL (admin UI)
// ============================
export const createZoomManualImportVideo = mutation({
    args: {
        meetingId: v.string(),
        meetingTopic: v.string(),
        mp4DownloadUrl: v.string(),
        vttDownloadUrl: v.string(),
        chatMessages: v.optional(v.string()),
        duration: v.number(),
        secret: v.string(),
    },
    handler: async (ctx, args) => {
        if (!safeCompare(args.secret, process.env.CONVEX_INTERNAL_SECRET || "")) {
            throw new Error("Unauthorized: Invalid secret");
        }

        const safeTopic = args.meetingTopic.slice(0, 200);
        const title = `【Zoom】${safeTopic}`.slice(0, 200);

        // 「非公開」タグを取得 or 作成
        let unpublishedTag = await ctx.db
            .query("tags")
            .withIndex("by_slug", (q) => q.eq("slug", "非公開"))
            .first();

        if (!unpublishedTag) {
            const tagId = await ctx.db.insert("tags", {
                name: "非公開",
                slug: "非公開",
                createdAt: Date.now(),
            });
            unpublishedTag = await ctx.db.get(tagId);
        }

        const videoId = await ctx.db.insert("videos", {
            title,
            description: `Zoom ミーティング (ID: ${args.meetingId}) の手動取り込み録画`,
            isPublished: false,
            duration: Math.round(args.duration),
            zoomMeetingId: args.meetingId,
            zoomChatMessages: args.chatMessages || undefined,
            source: "zoom",
            tags: unpublishedTag ? [unpublishedTag._id] : [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        await ctx.db.insert("auditLogs", {
            action: "video.create.zoom_manual",
            targetType: "video",
            targetId: videoId,
            details: `Zoom manual import: ${safeTopic} (Meeting ID: ${args.meetingId})`.slice(0, 500),
            createdAt: Date.now(),
        });

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
            securityScanStatus: "pending",
            updatedAt: Date.now(),
        });

        // Schedule security scan (1-minute delay for Mux processing)
        // biome-ignore lint/suspicious/noExplicitAny: videoSecurity module not yet in generated API types
        await ctx.scheduler.runAfter(60_000, (internal as any).videoSecurity.runSecurityScan, {
            videoId: args.videoId,
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

        // 文字起こし保存後、自動でベクトルインデックスを作成
        await ctx.scheduler.runAfter(0, internal.rag.autoIndexVideoTranscription, {
            videoId: args.videoId,
        });
    },
});

export const updateVideoChatMessages = internalMutation({
    args: {
        videoId: v.id("videos"),
        chatMessages: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.videoId, {
            zoomChatMessages: args.chatMessages,
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
