import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const updateProgress = mutation({
    args: {
        videoId: v.id("videos"),
        currentTime: v.number(),
        completed: v.boolean(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) throw new Error("User not found");

        // Input validation
        if (args.currentTime < 0) throw new Error("currentTime must be >= 0");

        const video = await ctx.db.get(args.videoId);
        if (!video) throw new Error("Video not found");

        const existing = await ctx.db
            .query("videoProgress")
            .withIndex("by_user_and_video", (q) => q.eq("userId", user._id).eq("videoId", args.videoId))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                currentTime: args.currentTime,
                completed: args.completed || existing.completed, // 一度完了したら完了のまま
                lastWatchedAt: Date.now(),
                updatedAt: Date.now(),
            });
        } else {
            await ctx.db.insert("videoProgress", {
                userId: user._id,
                videoId: args.videoId,
                currentTime: args.currentTime,
                completed: args.completed,
                lastWatchedAt: Date.now(),
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        }
    },
});

export const getProgress = query({
    args: { videoId: v.id("videos") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) return null;

        return await ctx.db
            .query("videoProgress")
            .withIndex("by_user_and_video", (q) => q.eq("userId", user._id).eq("videoId", args.videoId))
            .first();
    },
});

export const getUserProgress = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) return [];

        return await ctx.db.query("videoProgress").withIndex("by_user_id", (q) => q.eq("userId", user._id));
    },
});

export const logLearningTime = mutation({
    args: {
        minutesWatched: v.number(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) throw new Error("User not found");

        // Input validation
        if (args.minutesWatched <= 0 || args.minutesWatched > 1440) {
            throw new Error("minutesWatched must be between 1 and 1440");
        }

        // Use JST for date
        const JST_OFFSET = 9 * 60 * 60 * 1000;
        const now = new Date(Date.now() + JST_OFFSET);
        const dateStr = now.toISOString().split("T")[0];

        const existingLog = await ctx.db
            .query("dailyLearningLogs")
            .withIndex("by_user_date", (q) => q.eq("userId", user._id).eq("date", dateStr))
            .first();

        if (existingLog) {
            await ctx.db.patch(existingLog._id, {
                minutesWatched: existingLog.minutesWatched + args.minutesWatched,
            });
        } else {
            await ctx.db.insert("dailyLearningLogs", {
                userId: user._id,
                date: dateStr,
                minutesWatched: args.minutesWatched,
            });
        }
    },
});
