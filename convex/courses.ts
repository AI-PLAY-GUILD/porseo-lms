import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 5000;

// Admin: 全コース取得（動画タイトル解決付き）
export const getCourses = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user?.isAdmin) throw new Error("Admin access required");

        const courses = await ctx.db.query("courses").order("desc").collect();

        return await Promise.all(
            courses.map(async (course) => {
                const videos = await Promise.all(course.videoIds.map((id) => ctx.db.get(id)));
                return {
                    ...course,
                    videos: videos.filter((v) => v !== null).map((v) => ({ _id: v._id, title: v.title })),
                };
            }),
        );
    },
});

// 公開コースのみ取得（ロール制限適用）
export const getPublishedCourses = query({
    handler: async (ctx) => {
        const courses = await ctx.db
            .query("courses")
            .filter((q) => q.eq(q.field("isPublished"), true))
            .order("desc")
            .collect();

        // ユーザー情報を取得（ロールチェック用）
        const identity = await ctx.auth.getUserIdentity();
        let user = null;
        if (identity) {
            user = await ctx.db
                .query("users")
                .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
                .first();
        }
        const isAdmin = user?.isAdmin ?? false;

        return await Promise.all(
            courses.map(async (course) => {
                const videos = await Promise.all(course.videoIds.map((id) => ctx.db.get(id)));
                const publishedVideos = videos.filter((v): v is NonNullable<typeof v> => v !== null && v.isPublished);

                // ロール制限チェック
                const hasRequiredRole =
                    !course.requiredRoles ||
                    course.requiredRoles.length === 0 ||
                    (user?.discordRoles ?? []).some((role) => course.requiredRoles.includes(role));
                const hasAccess = isAdmin || hasRequiredRole;

                return {
                    ...course,
                    videoCount: publishedVideos.length,
                    totalDuration: publishedVideos.reduce((sum, v) => sum + (v.duration ?? 0), 0),
                    isLocked: !hasAccess,
                };
            }),
        );
    },
});

// 単一コース取得（動画情報 + ユーザー進捗付き）
export const getCourseById = query({
    args: { courseId: v.id("courses") },
    handler: async (ctx, args) => {
        const course = await ctx.db.get(args.courseId);
        if (!course) return null;

        // ユーザー情報取得
        const identity = await ctx.auth.getUserIdentity();
        let isAdmin = false;
        let userId = null;
        let userRoles: string[] = [];

        if (identity) {
            const user = await ctx.db
                .query("users")
                .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
                .first();
            if (user?.isAdmin) isAdmin = true;
            if (user) {
                userId = user._id;
                userRoles = user.discordRoles ?? [];
            }
        }

        // 非公開コースは管理者のみ
        if (!course.isPublished && !isAdmin) return null;

        // ロール制限チェック
        if (!isAdmin && course.requiredRoles && course.requiredRoles.length > 0) {
            const hasRequiredRole = userRoles.some((role) => course.requiredRoles.includes(role));
            if (!hasRequiredRole) return null;
        }

        // 動画情報を解決
        const videos = await Promise.all(course.videoIds.map((id) => ctx.db.get(id)));

        // サムネイルURL解決
        const resolvedVideos = await Promise.all(
            videos
                .filter((v) => v !== null)
                .filter((v) => isAdmin || v.isPublished)
                .map(async (v) => {
                    let thumbnailUrl = null;
                    if (v.customThumbnailStorageId) {
                        thumbnailUrl = await ctx.storage.getUrl(v.customThumbnailStorageId);
                    }
                    return {
                        _id: v._id,
                        title: v.title,
                        description: v.description,
                        muxPlaybackId: v.muxPlaybackId,
                        duration: v.duration ?? 0,
                        thumbnailUrl,
                    };
                }),
        );

        // ユーザー進捗取得
        let progressMap = new Map<string, { completed: boolean; currentTime: number }>();
        if (userId) {
            const progressRecords = await ctx.db
                .query("videoProgress")
                .withIndex("by_user_id", (q) => q.eq("userId", userId))
                .collect();
            progressMap = new Map(
                progressRecords.map((p) => [p.videoId, { completed: p.completed, currentTime: p.currentTime }]),
            );
        }

        const videosWithProgress = resolvedVideos.map((v) => ({
            ...v,
            progress: progressMap.get(v._id) ?? null,
        }));

        const completedCount = videosWithProgress.filter((v) => v.progress?.completed).length;

        return {
            ...course,
            videos: videosWithProgress,
            completedCount,
            totalCount: videosWithProgress.length,
        };
    },
});

// Admin: コース作成
export const createCourse = mutation({
    args: {
        title: v.string(),
        description: v.optional(v.string()),
        videoIds: v.array(v.id("videos")),
        isPublished: v.boolean(),
        requiredRoles: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        if (args.title.length > MAX_TITLE_LENGTH)
            throw new Error(`Title must be ${MAX_TITLE_LENGTH} characters or less`);
        if (args.description && args.description.length > MAX_DESCRIPTION_LENGTH)
            throw new Error(`Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`);

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user?.isAdmin) throw new Error("Admin access required");

        const courseId = await ctx.db.insert("courses", {
            title: args.title,
            description: args.description,
            videoIds: args.videoIds,
            isPublished: args.isPublished,
            requiredRoles: args.requiredRoles ?? [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        await ctx.db.insert("auditLogs", {
            userId: user._id,
            action: "course.create",
            targetType: "course",
            targetId: courseId,
            details: args.title,
            createdAt: Date.now(),
        });

        return courseId;
    },
});

// Admin: コース更新
export const updateCourse = mutation({
    args: {
        courseId: v.id("courses"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        videoIds: v.optional(v.array(v.id("videos"))),
        isPublished: v.optional(v.boolean()),
        requiredRoles: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        if (args.title && args.title.length > MAX_TITLE_LENGTH)
            throw new Error(`Title must be ${MAX_TITLE_LENGTH} characters or less`);
        if (args.description && args.description.length > MAX_DESCRIPTION_LENGTH)
            throw new Error(`Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`);

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user?.isAdmin) throw new Error("Admin access required");

        const { courseId, ...updates } = args;
        await ctx.db.patch(courseId, {
            ...updates,
            updatedAt: Date.now(),
        });

        await ctx.db.insert("auditLogs", {
            userId: user._id,
            action: "course.update",
            targetType: "course",
            targetId: courseId,
            details: Object.keys(updates).join(", "),
            createdAt: Date.now(),
        });
    },
});

// Admin: コース削除
export const deleteCourse = mutation({
    args: { courseId: v.id("courses") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user?.isAdmin) throw new Error("Admin access required");

        const course = await ctx.db.get(args.courseId);
        await ctx.db.delete(args.courseId);

        await ctx.db.insert("auditLogs", {
            userId: user._id,
            action: "course.delete",
            targetType: "course",
            targetId: args.courseId,
            details: course?.title,
            createdAt: Date.now(),
        });
    },
});
