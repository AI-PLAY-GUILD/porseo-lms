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
        hasAgreedToTerms: v.optional(v.boolean()),
        hasAgreedToPrivacy: v.optional(v.boolean()),
        hasAgreedToGuidelines: v.optional(v.boolean()),
        agreedAt: v.optional(v.number()),

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
        zoomChatMessages: v.optional(v.string()),
        source: v.optional(v.string()), // "zoom" | "manual" | "upload"
        recordedAt: v.optional(v.number()), // Actual recording date (e.g. Zoom recording_start)
        // Security scan fields
        securityScanStatus: v.optional(v.string()), // "pending" | "scanning" | "clean" | "warning" | "error"
        securityFindings: v.optional(
            v.array(
                v.object({
                    timestamp: v.number(),
                    severity: v.string(),
                    type: v.string(),
                    description: v.string(),
                    detectedText: v.optional(v.string()),
                }),
            ),
        ),
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

    // notePromoLinks - ローテーション可能なプロモリンク
    notePromoLinks: defineTable({
        code: v.string(),
        isActive: v.boolean(),
        maxRedemptions: v.number(),
        currentRedemptions: v.number(),
        expiresAt: v.optional(v.number()),
        createdBy: v.id("users"),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_code", ["code"])
        .index("by_is_active", ["isActive"]),

    // noteTrialUsers - トライアルユーザー追跡
    noteTrialUsers: defineTable({
        userId: v.id("users"),
        promoLinkId: v.id("notePromoLinks"),
        ipAddress: v.string(),
        ipHash: v.string(),
        status: v.string(),
        trialStartedAt: v.number(),
        trialExpiresAt: v.number(),
        warningShownAt: v.optional(v.number()),
        expiredAt: v.optional(v.number()),
        convertedToSubscription: v.boolean(),
        createdAt: v.number(),
    })
        .index("by_user_id", ["userId"])
        .index("by_ip_hash", ["ipHash"])
        .index("by_status", ["status"])
        .index("by_trial_expires_at", ["trialExpiresAt"]),

    // noteMembershipClaims - noteメンバー本人申請とCSV/管理者監査の状態
    noteMembershipClaims: defineTable({
        userId: v.id("users"),
        noteId: v.string(),
        memberNumber: v.optional(v.string()),
        planName: v.optional(v.string()),
        externalAccount: v.optional(v.string()),
        status: v.string(), // "active" | "confirmed" | "review" | "rejected"
        claimedAt: v.number(),
        updatedAt: v.number(),
        lastVerifiedAt: v.optional(v.number()),
        verifiedBy: v.optional(v.id("users")),
        rejectedAt: v.optional(v.number()),
        rejectedBy: v.optional(v.id("users")),
        reviewNote: v.optional(v.string()),
        lastCsvImportId: v.optional(v.id("noteMembershipImports")),
    })
        .index("by_user_id", ["userId"])
        .index("by_note_id", ["noteId"])
        .index("by_member_number", ["memberNumber"])
        .index("by_status", ["status"]),

    noteMembershipImports: defineTable({
        importedBy: v.id("users"),
        rowCount: v.number(),
        matchedCount: v.number(),
        unmatchedCount: v.number(),
        rejectedCount: v.number(),
        createdAt: v.number(),
    })
        .index("by_imported_by", ["importedBy"])
        .index("by_created_at", ["createdAt"]),
});
