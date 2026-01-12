import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// 1. Stripe Customer IDからユーザーを取得
export const getUserByStripeCustomerId = query({
    args: { stripeCustomerId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_stripe_customer_id", (q) => q.eq("stripeCustomerId", args.stripeCustomerId))
            .first();
    },
});

// 2. Discord IDを使ってサブスクリプション状態を更新（決済成功時）
export const updateSubscriptionStatus = mutation({
    args: {
        discordId: v.string(),
        stripeCustomerId: v.string(),
        subscriptionStatus: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_discord_id", (q) => q.eq("discordId", args.discordId))
            .first();

        if (!user) {
            throw new Error(`User with Discord ID ${args.discordId} not found`);
        }

        await ctx.db.patch(user._id, {
            stripeCustomerId: args.stripeCustomerId,
            subscriptionStatus: args.subscriptionStatus,
        });
    },
});

// 3. Stripe Customer IDを使ってサブスクリプション状態を更新（キャンセル/失敗時）
export const updateSubscriptionStatusByCustomerId = mutation({
    args: {
        stripeCustomerId: v.string(),
        subscriptionStatus: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_stripe_customer_id", (q) => q.eq("stripeCustomerId", args.stripeCustomerId))
            .first();

        if (!user) {
            console.warn(`User with Stripe Customer ID ${args.stripeCustomerId} not found`);
            return;
        }

        await ctx.db.patch(user._id, {
            subscriptionStatus: args.subscriptionStatus,
        });
    },
});

export const batchMigrateUsers = internalMutation({
    args: {
        users: v.array(
            v.object({
                email: v.string(),
                clerkId: v.optional(v.string()),
                stripeCustomerId: v.string(),
                name: v.string(),
                subscriptionStatus: v.optional(v.string()),
            })
        ),
    },
    handler: async (ctx, args) => {
        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[],
        };

        for (const user of args.users) {
            try {
                // Check if user already exists by Clerk ID (if provided)
                let existingUser = null;
                if (user.clerkId) {
                    existingUser = await ctx.db
                        .query("users")
                        .withIndex("by_clerk_id", (q) => q.eq("clerkId", user.clerkId!))
                        .first();
                } else {
                    // If no Clerk ID, check by email (Wix migration case)
                    existingUser = await ctx.db
                        .query("users")
                        .withIndex("by_email", (q) => q.eq("email", user.email))
                        .first();
                }

                if (existingUser) {
                    // Update existing user
                    await ctx.db.patch(existingUser._id, {
                        stripeCustomerId: user.stripeCustomerId,
                        subscriptionStatus: user.subscriptionStatus || "active", // Default to active if migrating
                        updatedAt: Date.now(),
                    });
                } else {
                    // Create new user
                    await ctx.db.insert("users", {
                        // Use provided Clerk ID if available, otherwise use a placeholder for Wix migration
                        clerkId: user.clerkId || `wix_migration:${user.email}`,
                        email: user.email,
                        name: user.name,
                        stripeCustomerId: user.stripeCustomerId,
                        subscriptionStatus: user.subscriptionStatus || "active",
                        discordRoles: [],
                        isAdmin: false,
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                    });
                }
                results.success++;
            } catch (error: any) {
                results.failed++;
                results.errors.push(`Failed to migrate ${user.email}: ${error.message}`);
            }
        }

        return results;
    },
});


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

export const updateUserStripeInfo = internalMutation({
    args: {
        userId: v.id("users"),
        stripeCustomerId: v.string(),
        subscriptionStatus: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.userId, {
            stripeCustomerId: args.stripeCustomerId,
            subscriptionStatus: args.subscriptionStatus,
            updatedAt: Date.now(),
        });
    },
});
