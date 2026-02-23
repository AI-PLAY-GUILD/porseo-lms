import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const batchMigrateUsers = internalMutation({
    args: {
        users: v.array(
            v.object({
                clerkId: v.optional(v.string()), // Optional because some might not have it
                email: v.string(),
                name: v.string(),
                imageUrl: v.optional(v.string()),
                discordId: v.optional(v.string()),
                discordRoles: v.optional(v.array(v.string())),
                stripeCustomerId: v.optional(v.string()),
                subscriptionStatus: v.optional(v.string()),
                subscriptionName: v.optional(v.string()),
                isAdmin: v.optional(v.boolean()),
            }),
        ),
    },
    handler: async (ctx, args) => {
        for (const user of args.users) {
            // Check if user exists by email
            const existing = await ctx.db
                .query("users")
                .withIndex("by_email", (q) => q.eq("email", user.email))
                .first();

            if (existing) {
                // Update existing user
                await ctx.db.patch(existing._id, {
                    ...user,
                    clerkId: user.clerkId || existing.clerkId, // Keep existing clerkId if not provided
                    updatedAt: Date.now(),
                });
            } else {
                // Create new user
                await ctx.db.insert("users", {
                    ...user,
                    clerkId: user.clerkId || `wix_migration:${user.email}`, // Placeholder if missing
                    discordRoles: user.discordRoles || [],
                    isAdmin: user.isAdmin || false,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
            }
        }
    },
});
