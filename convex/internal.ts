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

// 4. ユーザー情報を保存・更新（Clerk連携用）
export const storeUser = mutation({
    args: {
        clerkId: v.string(),
        email: v.string(),
        name: v.string(),
        imageUrl: v.optional(v.string()),
        discordId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
            .first();

        if (user) {
            await ctx.db.patch(user._id, {
                email: args.email,
                name: args.name,
                imageUrl: args.imageUrl,
                discordId: args.discordId,
                updatedAt: Date.now(),
            });
            return user._id;
        }

        const userId = await ctx.db.insert("users", {
            clerkId: args.clerkId,
            email: args.email,
            name: args.name,
            imageUrl: args.imageUrl,
            discordId: args.discordId,
            discordRoles: [],
            isAdmin: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
        return userId;
    },
});

export const batchMigrateUsers = internalMutation({
    args: {
        users: v.array(
            v.object({
                email: v.string(),
                clerkId: v.string(),
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
                // Check if user already exists by Clerk ID
                const existingUser = await ctx.db
                    .query("users")
                    .withIndex("by_clerk_id", (q) => q.eq("clerkId", user.clerkId))
                    .first();

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
                        // Use provided Clerk ID if available, otherwise use a placeholder that won't collide with real Clerk IDs
                        clerkId: user.clerkId || `migrated:${user.email}`,
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

