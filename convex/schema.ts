import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        clerkId: v.string(),
        email: v.string(),
        name: v.string(),
        imageUrl: v.optional(v.string()),
        discordId: v.optional(v.string()),
        discordRoles: v.array(v.string()),
        stripeCustomerId: v.optional(v.string()),
        subscriptionStatus: v.optional(v.string()),
        subscriptionName: v.optional(v.string()),
        isAdmin: v.boolean(),

        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_clerk_id", ["clerkId"])
        .index("by_discord_id", ["discordId"])
        .index("by_stripe_customer_id", ["stripeCustomerId"])
        .index("by_email", ["email"]),

    videos: defineTable({
        title: v.string(),
        description: v.optional(v.string()),
        muxPlaybackId: v.optional(v.string()),
        muxAssetId: v.optional(v.string()),
        isPublished: v.boolean(),
        transcription: v.optional(v.string()),
        summary: v.optional(v.string()),
        chapters: v.optional(
            v.array(
                v.object({
                    title: v.string(),
                    startTime: v.number(),
                    description: v.optional(v.string()),
                }),
            ),
        ),
        requiredRoles: v.optional(v.array(v.string())),
        duration: v.optional(v.number()),
        order: v.optional(v.number()),
        uploadedBy: v.optional(v.id("users")),
        isAiProcessed: v.optional(v.boolean()),
        customThumbnailStorageId: v.optional(v.id("_storage")),
        tags: v.optional(v.array(v.id("tags"))),
        // Zoom integration fields
        zoomMeetingId: v.optional(v.string()),
        zoomRecordingId: v.optional(v.string()),
        source: v.optional(v.string()), // "zoom" | "manual" | "upload"
        createdAt: v.number(),
        updatedAt: v.number(),
    }).index("by_zoom_recording_id", ["zoomRecordingId"]),

    tags: defineTable({
        name: v.string(),
        slug: v.string(),
        createdAt: v.number(),
    }).index("by_slug", ["slug"]),

    videoProgress: defineTable({
        userId: v.id("users"),
        videoId: v.id("videos"),
        currentTime: v.number(),
        completed: v.boolean(),
        isHidden: v.optional(v.boolean()),
        lastWatchedAt: v.number(),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_user_and_video", ["userId", "videoId"])
        .index("by_user_id", ["userId"]),

    courses: defineTable({
        title: v.string(),
        description: v.optional(v.string()),
        thumbnailUrl: v.optional(v.string()),
        requiredRoles: v.array(v.string()),
        videoIds: v.array(v.id("videos")),
        isPublished: v.boolean(),
        createdAt: v.number(),
        updatedAt: v.number(),
    }),

    dailyLearningLogs: defineTable({
        userId: v.id("users"),
        date: v.string(), // YYYY-MM-DD
        minutesWatched: v.number(),
    })
        .index("by_user_date", ["userId", "date"])
        .index("by_user", ["userId"]),

    auditLogs: defineTable({
        userId: v.optional(v.id("users")), // optional for system-initiated actions (Zoom webhook etc.)
        action: v.string(), // e.g. "video.create", "video.delete", "tag.create"
        targetType: v.string(), // e.g. "video", "tag", "user"
        targetId: v.optional(v.string()),
        details: v.optional(v.string()),
        createdAt: v.number(),
    })
        .index("by_user", ["userId"])
        .index("by_action", ["action"])
        .index("by_created_at", ["createdAt"]),

    processedStripeEvents: defineTable({
        eventId: v.string(),
        eventType: v.string(),
        processedAt: v.number(),
    }).index("by_event_id", ["eventId"]),

    processedZoomEvents: defineTable({
        eventId: v.string(),
        eventType: v.string(),
        processedAt: v.number(),
    }).index("by_event_id", ["eventId"]),

    transcription_chunks: defineTable({
        videoId: v.id("videos"),
        startTime: v.number(),
        endTime: v.number(),
        text: v.string(),
        embedding: v.array(v.number()),
    })
        .index("by_video_id", ["videoId"])
        .vectorIndex("by_embedding", {
            vectorField: "embedding",
            dimensions: 1536,
            filterFields: ["videoId"],
        }),
});
