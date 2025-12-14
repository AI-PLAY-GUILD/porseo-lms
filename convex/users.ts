import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const syncUser = mutation({
    args: {
        clerkId: v.string(),
        email: v.string(),
        name: v.string(),
        imageUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
            .first();

        const isAdmin = args.clerkId === process.env.ADMIN_CLERK_ID;

        console.log("Syncing user:", args.clerkId);
        console.log("Is Admin?:", isAdmin);

        if (existing) {
            await ctx.db.patch(existing._id, {
                ...args,
                isAdmin: existing.isAdmin || isAdmin, // 既存の管理者は維持、新規一致なら付与
                updatedAt: Date.now(),
            });
            return existing._id;
        } else {
            const newUserId = await ctx.db.insert("users", {
                ...args,
                discordRoles: [], // 初期値は空、あとでDiscord連携で更新
                isAdmin,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
            return newUserId;
        }
    },
});

export const getUser = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        return await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();
    },
});

export const updateDiscordRoles = mutation({
    args: {
        clerkId: v.string(),
        discordRoles: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
            .first();

        if (!user) {
            throw new Error("User not found");
        }

        await ctx.db.patch(user._id, {
            discordRoles: args.discordRoles,
            updatedAt: Date.now(),
        });
    },
});

export const checkAccess = query({
    args: { videoId: v.id("videos") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return { hasAccess: false };

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        const video = await ctx.db.get(args.videoId);
        if (!video || !user) return { hasAccess: false };

        // 管理者は全てアクセス可能
        if (user.isAdmin) return { hasAccess: true };

        // 必要なロールをチェック
        // 動画にロール制限がない場合はアクセス可能とする（要件によるが、今回は制限あり前提）
        if (!video.requiredRoles || video.requiredRoles.length === 0) return { hasAccess: true };

        const hasRequiredRole = video.requiredRoles.some(role =>
            user.discordRoles.includes(role)
        );

        return { hasAccess: hasRequiredRole };
    },
});

export const getUserByClerkId = async (ctx: any, clerkId: string) => {
    return await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", clerkId))
        .first();
};
