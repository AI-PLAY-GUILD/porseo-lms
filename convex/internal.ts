import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const setStripeCustomerId = internalMutation({
    args: {
        userId: v.id("users"),
        stripeCustomerId: v.string(),
    },
    handler: async (ctx, args) => {
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
