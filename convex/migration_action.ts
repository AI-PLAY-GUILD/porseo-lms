// Security: Changed from public action to internalAction (Issue #5)
// This migration utility should never be publicly accessible.
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export const runBatchMigrate = internalAction({
    args: {
        users: v.array(v.any()), // Accept any object to be flexible, validation happens in mutation
    },
    handler: async (ctx, args) => {
        await ctx.runMutation(internal.migrations.batchMigrateUsers, {
            users: args.users,
        });
    },
});
