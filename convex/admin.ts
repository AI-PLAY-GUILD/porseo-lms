import { v } from "convex/values";
import { query } from "./_generated/server";
import { getUserByClerkId } from "./users";

// Helper to check if user is admin
async function checkAdmin(ctx: any) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        throw new Error("Unauthorized");
    }
    const user = await getUserByClerkId(ctx, identity.subject);
    if (!user || !user.isAdmin) {
        throw new Error("Unauthorized: Admin access required");
    }
    return user;
}

export const getAdminStats = query({
    args: {
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        await checkAdmin(ctx);

        const users = await ctx.db.query("users").collect();
        const videos = await ctx.db.query("videos").collect();
        const progress = await ctx.db.query("videoProgress").collect();
        const logs = await ctx.db.query("dailyLearningLogs").collect();

        const totalUsers = users.length;

        // Filter logs by date range if provided
        // logs.date is YYYY-MM-DD string
        const JST_OFFSET = 9 * 60 * 60 * 1000;

        let filteredLogs = logs;
        let filteredProgress = progress;

        if (args.startDate && args.endDate) {
            const startStr = new Date(args.startDate + JST_OFFSET).toISOString().split("T")[0];
            const endStr = new Date(args.endDate + JST_OFFSET).toISOString().split("T")[0];

            filteredLogs = logs.filter(l => l.date >= startStr && l.date <= endStr);

            // For progress, we use lastWatchedAt
            filteredProgress = progress.filter(p =>
                p.lastWatchedAt >= args.startDate! && p.lastWatchedAt <= args.endDate!
            );
        } else {
            // Default to last 30 days for active users if no range
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];
            filteredLogs = logs.filter(l => l.date >= thirtyDaysAgoStr);
        }

        const activeUserIds = new Set(filteredLogs.map(l => l.userId));
        const activeUsers = activeUserIds.size;

        // Total watch time (minutes) within range
        const totalWatchTimeMinutes = filteredLogs.reduce((acc, l) => acc + l.minutesWatched, 0);
        const totalWatchTimeHours = Math.round((totalWatchTimeMinutes / 60) * 10) / 10;

        // Completed videos count within range
        // Note: completed videos are filtered by lastWatchedAt in range, which is an approximation
        // ideally we'd have completedAt, but lastWatchedAt is close enough for "recently completed"
        const completedVideos = filteredProgress.filter(p => p.completed).length;

        return {
            totalUsers, // Total users is always all users
            activeUsers,
            totalWatchTimeHours,
            completedVideos,
        };
    },
});

export const getUserGrowth = query({
    args: {
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        await checkAdmin(ctx);

        const users = await ctx.db.query("users").collect();

        // Use JST (UTC+9) for date calculation
        const JST_OFFSET = 9 * 60 * 60 * 1000;

        let dateRange: string[] = [];

        if (args.startDate && args.endDate) {
            const start = new Date(args.startDate + JST_OFFSET);
            const end = new Date(args.endDate + JST_OFFSET);

            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                dateRange.push(d.toISOString().split("T")[0]);
            }
        } else {
            // Default to last 30 days
            const now = Date.now();
            const todayJst = new Date(now + JST_OFFSET);
            dateRange = Array.from({ length: 30 }, (_, i) => {
                const d = new Date(todayJst);
                d.setDate(d.getDate() - (29 - i));
                return d.toISOString().split("T")[0];
            });
        }

        const growthData = dateRange.map(date => {
            // Count users created on this date (in JST)
            const count = users.filter(u => {
                const uDateJst = new Date(u.createdAt + JST_OFFSET).toISOString().split("T")[0];
                return uDateJst === date;
            }).length;

            return {
                date,
                count,
            };
        });

        return growthData;
    },
});

export const getContentPerformance = query({
    args: {
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        // Validating admin access and fetching performance stats
        await checkAdmin(ctx);

        const videos = await ctx.db.query("videos").collect();
        const progress = await ctx.db.query("videoProgress").collect();

        const stats = videos.map(video => {
            let videoProgress = progress.filter(p => p.videoId === video._id);

            // Filter by date range if provided
            if (args.startDate && args.endDate) {
                videoProgress = videoProgress.filter(p =>
                    p.lastWatchedAt >= args.startDate! && p.lastWatchedAt <= args.endDate!
                );
            }

            const views = videoProgress.length;
            const completions = videoProgress.filter(p => p.completed).length;

            // Calculate average completion rate
            let totalCompletionRate = 0;
            if (video.duration) {
                totalCompletionRate = videoProgress.reduce((acc, p) => {
                    const rate = Math.min(1, p.currentTime / video.duration!);
                    return acc + rate;
                }, 0);
            }
            const avgCompletionRate = views > 0 ? (totalCompletionRate / views) * 100 : 0;

            return {
                id: video._id,
                title: video.title,
                views,
                completions,
                avgCompletionRate: Math.round(avgCompletionRate),
            };
        });

        // Sort by views descending
        return stats.sort((a, b) => b.views - a.views);
    },
});

export const getUserBehaviorAnalytics = query({
    args: {
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        await checkAdmin(ctx);

        const logs = await ctx.db.query("dailyLearningLogs").collect();
        const users = await ctx.db.query("users").collect();

        const JST_OFFSET = 9 * 60 * 60 * 1000;
        let filteredLogs = logs;

        if (args.startDate && args.endDate) {
            const startStr = new Date(args.startDate + JST_OFFSET).toISOString().split("T")[0];
            const endStr = new Date(args.endDate + JST_OFFSET).toISOString().split("T")[0];
            filteredLogs = logs.filter(l => l.date >= startStr && l.date <= endStr);
        } else {
            // Default to last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];
            filteredLogs = logs.filter(l => l.date >= thirtyDaysAgoStr);
        }

        // 1. Daily Activity (Total minutes watched per day)
        const dailyActivityMap = new Map<string, number>();
        filteredLogs.forEach(log => {
            const current = dailyActivityMap.get(log.date) || 0;
            dailyActivityMap.set(log.date, current + log.minutesWatched);
        });

        const dailyActivity = Array.from(dailyActivityMap.entries())
            .map(([date, minutes]) => ({ date, minutes }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // 2. Top Learners (Users with most watch time in range)
        const userWatchTimeMap = new Map<string, number>();
        filteredLogs.forEach(log => {
            const current = userWatchTimeMap.get(log.userId) || 0;
            userWatchTimeMap.set(log.userId, current + log.minutesWatched);
        });

        const topLearners = Array.from(userWatchTimeMap.entries())
            .map(([userId, minutes]) => {
                const user = users.find(u => u._id === userId);
                return {
                    userId,
                    name: user?.name || "Unknown",
                    email: user?.email || "",
                    imageUrl: user?.imageUrl,
                    minutesWatched: minutes,
                };
            })
            .sort((a, b) => b.minutesWatched - a.minutesWatched)
            .slice(0, 10); // Top 10

        return {
            dailyActivity,
            topLearners,
        };
    },
});

export const getAuditLogs = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        await checkAdmin(ctx);

        const logs = await ctx.db
            .query("auditLogs")
            .order("desc")
            .take(args.limit ?? 50);

        const users = await ctx.db.query("users").collect();
        const userMap = new Map(users.map(u => [u._id, u]));

        return logs.map(log => ({
            ...log,
            userName: log.userId ? (userMap.get(log.userId)?.name ?? "Unknown") : "System",
        }));
    },
});

