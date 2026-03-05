import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

// Note: getUserByStripeCustomerId, updateSubscriptionStatus, updateSubscriptionStatusByCustomerId
// are defined in users.ts as public mutations with secret-based auth (for ConvexHttpClient access).
// See Issue #30 for architectural context.

export const batchMigrateUsers = internalMutation({
    args: {
        users: v.array(
            v.object({
                email: v.string(),
                clerkId: v.optional(v.string()),
                stripeCustomerId: v.string(),
                name: v.string(),
                subscriptionStatus: v.optional(v.string()),
            }),
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
            } catch (error: unknown) {
                results.failed++;
                results.errors.push(
                    `Failed to migrate ${user.email}: ${error instanceof Error ? error.message : String(error)}`,
                );
            }
        }

        return results;
    },
});

// Admin: メールアドレスでStripe顧客IDを紐付け（手動運用用）
export const adminLinkStripeByEmail = internalMutation({
    args: {
        email: v.string(),
        stripeCustomerId: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();

        if (!user) {
            // emailインデックスで見つからない場合、filterで検索
            const userByFilter = await ctx.db
                .query("users")
                .filter((q) => q.eq(q.field("email"), args.email))
                .first();
            if (!userByFilter) {
                return { success: false, message: `ユーザーが見つかりません: ${args.email}` };
            }
            await ctx.db.patch(userByFilter._id, {
                stripeCustomerId: args.stripeCustomerId,
                updatedAt: Date.now(),
            });
            return {
                success: true,
                message: `紐付け完了: ${args.email} → ${args.stripeCustomerId}`,
                userId: userByFilter._id,
            };
        }

        await ctx.db.patch(user._id, {
            stripeCustomerId: args.stripeCustomerId,
            updatedAt: Date.now(),
        });
        return { success: true, message: `紐付け完了: ${args.email} → ${args.stripeCustomerId}`, userId: user._id };
    },
});

// Admin: メールアドレスでユーザー情報を取得（調査用）
export const adminGetUserByEmail = internalQuery({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();
        if (!user) {
            const userByFilter = await ctx.db
                .query("users")
                .filter((q) => q.eq(q.field("email"), args.email))
                .first();
            return userByFilter;
        }
        return user;
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
