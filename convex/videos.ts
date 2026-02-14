import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

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

        const videoId = await ctx.db.insert("videos", {
            ...args,
            duration: args.duration ?? 0,
            order: 0,
            isPublished: false,
            uploadedBy: user._id,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        await ctx.db.insert("auditLogs", {
            userId: user._id,
            action: "video.create",
            targetType: "video",
            targetId: videoId,
            details: args.title,
            createdAt: Date.now(),
        });

        return videoId;
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

        // Helper to resolve thumbnail
        const resolveThumbnail = async (storageId?: string) => {
            if (!storageId) return null;
            return await ctx.storage.getUrl(storageId);
        };

        // Helper to strip sensitive data from videos the user can't access
        // Security fix (Issue #14): Hide muxPlaybackId for role-restricted videos
        const sanitizeVideo = (video: any, hasAccess: boolean) => {
            if (hasAccess) return video;
            // Return metadata only, hide playback info
            const { muxPlaybackId, muxAssetId, transcription, ...safe } = video;
            return { ...safe, muxPlaybackId: null, muxAssetId: null, isLocked: true };
        };

        // 2. If not logged in, return videos but hide role-restricted content
        if (!identity) {
            return await Promise.all(videos.map(async (v) => {
                const hasAccess = !v.requiredRoles || v.requiredRoles.length === 0;
                return {
                    ...sanitizeVideo(v, hasAccess),
                    userProgress: null,
                    thumbnailUrl: await resolveThumbnail(v.customThumbnailStorageId)
                };
            }));
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) {
            return await Promise.all(videos.map(async (v) => {
                const hasAccess = !v.requiredRoles || v.requiredRoles.length === 0;
                return {
                    ...sanitizeVideo(v, hasAccess),
                    userProgress: null,
                    thumbnailUrl: await resolveThumbnail(v.customThumbnailStorageId)
                };
            }));
        }

        // 3. Get user's progress for all videos
        const progressRecords = await ctx.db
            .query("videoProgress")
            .withIndex("by_user_id", (q) => q.eq("userId", user._id))
            .collect();

        const progressMap = new Map(progressRecords.map(p => [p.videoId, p]));

        // 4. Merge progress, resolve thumbnail, and check role access
        return await Promise.all(videos.map(async (video) => {
            const thumbnailUrl = await resolveThumbnail(video.customThumbnailStorageId);

            // Admin can see everything
            const isAdmin = user.isAdmin;
            const hasRequiredRole = !video.requiredRoles || video.requiredRoles.length === 0 ||
                video.requiredRoles.some((role: string) => user.discordRoles?.includes(role));
            const hasAccess = isAdmin || hasRequiredRole;

            return {
                ...sanitizeVideo(video, hasAccess),
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

        // --- Security Check Start ---
        const identity = await ctx.auth.getUserIdentity();
        let isAdmin = false;

        if (identity) {
            const user = await ctx.db
                .query("users")
                .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
                .first();
            if (user && user.isAdmin) {
                isAdmin = true;
            }

            // Check roles for non-admin users
            if (!isAdmin) {
                // 1. Unpublished videos check
                if (!video.isPublished) {
                    return null; // or throw new Error("NotFound");
                }

                // 2. Role check
                if (video.requiredRoles && video.requiredRoles.length > 0) {
                    if (!user) return null; // Logged in but no user record?!
                    const hasRequiredRole = video.requiredRoles.some(role =>
                        user.discordRoles?.includes(role)
                    );
                    if (!hasRequiredRole) {
                        return null; // Hide the video completely or return metadata only if needed (for now, safe default is null)
                    }
                }
            }
        } else {
            // Not logged in
            // 1. Unpublished check
            if (!video.isPublished) return null;

            // 2. Role check (guests have no roles)
            if (video.requiredRoles && video.requiredRoles.length > 0) {
                return null;
            }
        }
        // --- Security Check End ---

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

        // Security: Admin-only (Issue #12)
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();
        if (!user?.isAdmin) throw new Error("Admin access required");

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

        await ctx.db.insert("auditLogs", {
            userId: user._id,
            action: "video.update",
            targetType: "video",
            targetId: videoId,
            details: Object.keys(updates).join(", "),
            createdAt: Date.now(),
        });
    },
});

export const updateVideoAiMetadata = internalMutation({
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

        const video = await ctx.db.get(args.videoId);
        await ctx.db.delete(args.videoId);

        await ctx.db.insert("auditLogs", {
            userId: user._id,
            action: "video.delete",
            targetType: "video",
            targetId: args.videoId,
            details: video?.title,
            createdAt: Date.now(),
        });
    },
});
