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

        const existing = await ctx.db
            .query("videoProgress")
            .withIndex("by_user_and_video", (q) =>
                q.eq("userId", user._id).eq("videoId", args.videoId)
            )
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
            .withIndex("by_user_and_video", (q) =>
                q.eq("userId", user._id).eq("videoId", args.videoId)
            )
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

        return await ctx.db
            .query("videoProgress")
            .withIndex("by_user_id", (q) => q.eq("userId", user._id))
            .collect();
    },
});


