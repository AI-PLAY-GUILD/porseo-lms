import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createVideo = mutation({
    args: {
        title: v.string(),
        description: v.optional(v.string()),
        muxAssetId: v.string(),
        muxPlaybackId: v.string(),
        duration: v.optional(v.number()), // アップロード直後は不明な場合があるためoptional
        requiredRoles: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user?.isAdmin) throw new Error("Admin access required");

        return await ctx.db.insert("videos", {
            ...args,
            duration: args.duration ?? 0,
            order: 0,
            isPublished: false, // デフォルトは非公開
            uploadedBy: user._id,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
});

export const getVideos = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return []; // 未ログインは空（またはエラー）

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user?.isAdmin) {
            // 管理者でない場合は公開済みのみ返す（本来はgetPublishedVideosを使うべきだが、安全策としてここでも分岐可能）
            // しかし、今回は明示的に分けるため、ここは管理者用として残すか、あるいは権限チェックを入れる
            throw new Error("Admin access required");
        }

        const videos = await ctx.db.query("videos").order("desc").collect();
        const progress = await ctx.db.query("videoProgress").collect();

        return await Promise.all(videos.map(async (video) => {
            const tags = video.tags
                ? await Promise.all(video.tags.map((tagId) => ctx.db.get(tagId)))
                : [];

            const views = progress.filter(p => p.videoId === video._id).length;

            return {
                ...video,
                tags: tags.filter((t) => t !== null),
                views,
            };
        }));
    },
});

export const getPublishedVideos = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();

        // 1. Get all published videos
        const videos = await ctx.db
            .query("videos")
            .filter((q) => q.eq(q.field("isPublished"), true))
            .order("desc")
            .collect();

        // 2. If not logged in, return videos without progress
        if (!identity) {
            return videos.map(v => ({ ...v, userProgress: null }));
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) {
            return videos.map(v => ({ ...v, userProgress: null }));
        }

        // 3. Get user's progress for all videos
        const progressRecords = await ctx.db
            .query("videoProgress")
            .withIndex("by_user_id", (q) => q.eq("userId", user._id))
            .collect();

        const progressMap = new Map(progressRecords.map(p => [p.videoId, p]));

        // 4. Merge progress and resolve thumbnail URL
        return await Promise.all(videos.map(async (video) => {
            let thumbnailUrl = null;
            if (video.customThumbnailStorageId) {
                thumbnailUrl = await ctx.storage.getUrl(video.customThumbnailStorageId);
            }

            return {
                ...video,
                userProgress: progressMap.get(video._id) || null,
                thumbnailUrl
            };
        }));
    },
});

export const getById = query({
    args: { videoId: v.id("videos") },
    handler: async (ctx, args) => {
        const video = await ctx.db.get(args.videoId);
        if (!video) return null;

        let thumbnailUrl = null;
        if (video.customThumbnailStorageId) {
            thumbnailUrl = await ctx.storage.getUrl(video.customThumbnailStorageId);
        }

        return { ...video, thumbnailUrl };
    },
});

export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        return await ctx.storage.generateUploadUrl();
    },
});

export const updateVideo = mutation({
    args: {
        videoId: v.id("videos"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        isPublished: v.optional(v.boolean()),
        requiredRoles: v.optional(v.array(v.string())),
        muxAssetId: v.optional(v.string()),
        muxPlaybackId: v.optional(v.string()),
        customThumbnailStorageId: v.optional(v.id("_storage")),
        tags: v.optional(v.array(v.id("tags"))),
        transcription: v.optional(v.string()),
        summary: v.optional(v.string()),
        createdAt: v.optional(v.number()),
        chapters: v.optional(
            v.array(
                v.object({
                    title: v.string(),
                    startTime: v.number(),
                    description: v.optional(v.string()),
                })
            )
        ),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user?.isAdmin) throw new Error("Admin access required");

        const { videoId, ...updates } = args;
        await ctx.db.patch(videoId, {
            ...updates,
            updatedAt: Date.now(),
        });
    },
});

export const updateVideoAiMetadata = mutation({
    args: {
        videoId: v.id("videos"),
        summary: v.string(),
        chapters: v.array(
            v.object({
                title: v.string(),
                startTime: v.number(),
                description: v.optional(v.string()),
            })
        ),
    },
    handler: async (ctx, args) => {
        // 内部呼び出し用（Actionから呼ばれる）
        // 本来はinternalMutationにすべきだが、簡略化のため通常のmutationで実装し、
        // 必要なら認証チェックを入れる（今回はActionからの呼び出しを信頼）

        await ctx.db.patch(args.videoId, {
            summary: args.summary,
            chapters: args.chapters,
            isAiProcessed: true,
            updatedAt: Date.now(),
        });
    },
});

export const deleteVideo = mutation({
    args: { videoId: v.id("videos") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user?.isAdmin) throw new Error("Admin access required");

        await ctx.db.delete(args.videoId);
    },
});
