import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { validateInternalSecret } from "./lib/requireSecret";

// Server-callable: check if a user has a note trial
export const checkUserHasTrial = query({
    args: {
        clerkId: v.string(),
        secret: v.string(),
    },
    handler: async (ctx, args) => {
        validateInternalSecret(args.secret);

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
            .first();
        if (!user) return false;

        const trial = await ctx.db
            .query("noteTrialUsers")
            .withIndex("by_user_id", (q) => q.eq("userId", user._id))
            .first();

        return !!trial && !trial.convertedToSubscription;
    },
});

// Server-callable: mark trial as converted
export const markTrialConvertedServer = mutation({
    args: {
        clerkId: v.string(),
        secret: v.string(),
    },
    handler: async (ctx, args) => {
        console.log("[notePromoServer:markTrialConvertedServer] 開始");
        validateInternalSecret(args.secret);

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
            .first();
        if (!user) return;

        const trial = await ctx.db
            .query("noteTrialUsers")
            .withIndex("by_user_id", (q) => q.eq("userId", user._id))
            .first();
        if (!trial) return;

        await ctx.db.patch(trial._id, {
            convertedToSubscription: true,
            status: "expired",
        });

        await ctx.db.insert("auditLogs", {
            userId: user._id,
            action: "note_trial.converted",
            targetType: "noteTrialUsers",
            targetId: trial._id,
            details: "Converted to paid subscription via Stripe checkout",
            createdAt: Date.now(),
        });

        console.log("[notePromoServer:markTrialConvertedServer] 完了");
    },
});
