// Security: Changed from public action to internalAction (Issue #5)
// This migration utility should never be publicly accessible.

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

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
