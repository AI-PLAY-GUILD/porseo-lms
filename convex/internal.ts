import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const setDiscordId = internalMutation({
    args: {
        userId: v.id("users"),
        discordId: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) return;
        // Only set if not already set (prevent overwrite from concurrent calls)
        if (!user.discordId) {
            await ctx.db.patch(args.userId, {
                discordId: args.discordId,
                updatedAt: Date.now(),
            });
            console.log("[internal:setDiscordId] Discord ID保存成功", { userId: args.userId });
        }
    },
});

export const setStripeCustomerId = internalMutation({
    args: {
        userId: v.id("users"),
        stripeCustomerId: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        // Don't overwrite if already linked (prevent race condition with linkStripeCustomerByEmail)
        if (user?.stripeCustomerId) {
            console.log("[internal:setStripeCustomerId] 既にStripe顧客IDがあるためスキップ", {
                userId: args.userId,
                existing: user.stripeCustomerId,
            });
            return;
        }
        await ctx.db.patch(args.userId, {
            stripeCustomerId: args.stripeCustomerId,
            updatedAt: Date.now(),
        });
    },
});

export const setStripeCustomerWithSubscription = internalMutation({
    args: {
        userId: v.id("users"),
        stripeCustomerId: v.string(),
        subscriptionStatus: v.string(),
        subscriptionName: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const patch: Record<string, unknown> = {
            stripeCustomerId: args.stripeCustomerId,
            subscriptionStatus: args.subscriptionStatus,
            updatedAt: Date.now(),
        };
        if (args.subscriptionName !== undefined) {
            patch.subscriptionName = args.subscriptionName;
        }
        await ctx.db.patch(args.userId, patch);
    },
});
