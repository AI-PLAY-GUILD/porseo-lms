import { v } from "convex/values";
import { query } from "./_generated/server";
import { getUserByClerkId } from "./users";

export const getStats = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }

        const user = await getUserByClerkId(ctx, identity.subject);
        if (!user) {
            return null;
        }

        // 1. Completed Videos
        const completedVideos = await ctx.db
            .query("videoProgress")
            .withIndex("by_user_id", (q) => q.eq("userId", user._id))
            .filter((q) => q.eq(q.field("completed"), true))
            .collect();

        const completedCount = completedVideos.length;

        // 2. Total Learning Time & Chart Data (Last 7 days)
        const today = new Date();
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(today);
            d.setDate(d.getDate() - (6 - i));
            return d.toISOString().split("T")[0];
        });

        const logs = await ctx.db
            .query("dailyLearningLogs")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();

        const totalMinutes = Math.ceil(logs.reduce((acc, log) => acc + log.minutesWatched, 0));
        const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

        // Chart Data Construction
        const chartData = last7Days.map((date) => {
            const log = logs.find((l) => l.date === date);
            // Date format for chart (e.g., "Mon", "12/13") - simpler is just day name or short date
            const d = new Date(date);
            const month = d.getMonth() + 1;
            const day = d.getDate();
            const weekday = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];
            const name = `${month}/${day} (${weekday})`;
            return {
                name,
                hours: log ? Math.round((log.minutesWatched / 60) * 10) / 10 : 0,
            };
        });

        // 3. Rank Logic (Simple gamification)
        let rank = "ビギナー";
        let nextRank = "ブロンズ";
        let progressToNext = 0;
        let itemsToNext = 3;

        if (completedCount >= 3) {
            rank = "ブロンズ";
            nextRank = "シルバー";
            itemsToNext = 10 - completedCount;
        }
        if (completedCount >= 10) {
            rank = "シルバー";
            nextRank = "ゴールド";
            itemsToNext = 30 - completedCount;
        }
        if (completedCount >= 30) {
            rank = "ゴールド";
            nextRank = "プラチナ";
            itemsToNext = 50 - completedCount;
        }

        // 4. Continuous Learning Streak
        // Sort logs by date descending (just in case, though usually they might be unordered)
        const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Get unique dates
        const uniqueDates = Array.from(new Set(sortedLogs.map(l => l.date)));

        let streakDays = 0;
        const todayStr = new Date().toISOString().split("T")[0];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        // Check if the user has learned today or yesterday to start the streak
        if (uniqueDates.length > 0) {
            const lastDate = uniqueDates[0];
            if (lastDate === todayStr || lastDate === yesterdayStr) {
                streakDays = 1;
                let currentDate = new Date(lastDate);

                for (let i = 1; i < uniqueDates.length; i++) {
                    const prevDate = new Date(currentDate);
                    prevDate.setDate(prevDate.getDate() - 1);
                    const prevDateStr = prevDate.toISOString().split("T")[0];

                    if (uniqueDates[i] === prevDateStr) {
                        streakDays++;
                        currentDate = prevDate;
                    } else {
                        break;
                    }
                }
            }
        }

        // 5. In-Progress Videos
        const inProgressRecords = await ctx.db
            .query("videoProgress")
            .withIndex("by_user_id", (q) => q.eq("userId", user._id))
            .filter((q) => q.eq(q.field("completed"), false))
            .collect();

        const inProgressVideos = await Promise.all(
            inProgressRecords.map(async (record) => {
                const video = await ctx.db.get(record.videoId);
                if (!video) return null;

                // Calculate progress percentage
                // Assuming video duration is stored in video.duration (seconds)
                // If duration is missing, default to 0 progress or estimate
                let progress = 0;
                if (video.duration && video.duration > 0) {
                    progress = Math.min(100, Math.round((record.currentTime / video.duration) * 100));
                }

                let thumbnailUrl = null;
                if (video.customThumbnailStorageId) {
                    thumbnailUrl = await ctx.storage.getUrl(video.customThumbnailStorageId);
                }

                return {
                    ...video,
                    progress,
                    lastWatchedAt: record.lastWatchedAt,
                    thumbnailUrl,
                };
            })
        );

        // Filter out nulls (deleted videos) and sort by last watched
        const validInProgressVideos = inProgressVideos
            .filter((v): v is NonNullable<typeof v> => v !== null)
            .sort((a, b) => b.lastWatchedAt - a.lastWatchedAt);

        return {
            totalHours,
            totalMinutes,
            completedCount,
            rank,
            nextRank,
            itemsToNext,
            streakDays,
            chartData,
            userName: user.name,
            userAvatar: user.imageUrl,
            inProgressVideos: validInProgressVideos,
            subscriptionStatus: user.subscriptionStatus,
        };
    },
});
