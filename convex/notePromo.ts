import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { validateInternalSecret } from "./lib/requireSecret";
import { getUserByClerkId } from "./users";

// Admin check helper (same pattern as admin.ts)
async function checkAdmin(ctx: QueryCtx | MutationCtx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await getUserByClerkId(ctx, identity.subject);
    if (!user || !user.isAdmin) throw new Error("Unauthorized: Admin access required");
    return user;
}

// Generate random alphanumeric code
function generateCode(length: number = 10): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let code = "";
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// ==================== Admin Functions ====================

export const createPromoLink = mutation({
    args: {
        maxRedemptions: v.number(),
        expiresAt: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        console.log("[notePromo:createPromoLink] 開始");
        const adminUser = await checkAdmin(ctx);

        const code = generateCode();

        const linkId = await ctx.db.insert("notePromoLinks", {
            code,
            isActive: true,
            maxRedemptions: args.maxRedemptions,
            currentRedemptions: 0,
            expiresAt: args.expiresAt,
            createdBy: adminUser._id,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        await ctx.db.insert("auditLogs", {
            userId: adminUser._id,
            action: "note_promo.create_link",
            targetType: "notePromoLinks",
            targetId: linkId,
            details: `code=${code}, maxRedemptions=${args.maxRedemptions}`,
            createdAt: Date.now(),
        });

        console.log("[notePromo:createPromoLink] 完了", { linkId, code });
        return { linkId, code };
    },
});

export const rotatePromoLink = mutation({
    args: {
        linkId: v.id("notePromoLinks"),
        newMaxRedemptions: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        console.log("[notePromo:rotatePromoLink] 開始", { linkId: args.linkId });
        const adminUser = await checkAdmin(ctx);

        const oldLink = await ctx.db.get(args.linkId);
        if (!oldLink) throw new Error("Link not found");

        // Deactivate old link
        await ctx.db.patch(args.linkId, {
            isActive: false,
            updatedAt: Date.now(),
        });

        // Create new link
        const code = generateCode();
        const newLinkId = await ctx.db.insert("notePromoLinks", {
            code,
            isActive: true,
            maxRedemptions: args.newMaxRedemptions ?? oldLink.maxRedemptions,
            currentRedemptions: 0,
            expiresAt: oldLink.expiresAt,
            createdBy: adminUser._id,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        await ctx.db.insert("auditLogs", {
            userId: adminUser._id,
            action: "note_promo.rotate_link",
            targetType: "notePromoLinks",
            targetId: newLinkId,
            details: `rotated from ${args.linkId}, newCode=${code}`,
            createdAt: Date.now(),
        });

        console.log("[notePromo:rotatePromoLink] 完了", { oldLinkId: args.linkId, newLinkId, code });
        return { newLinkId, code };
    },
});

export const deactivatePromoLink = mutation({
    args: { linkId: v.id("notePromoLinks") },
    handler: async (ctx, args) => {
        console.log("[notePromo:deactivatePromoLink] 開始", { linkId: args.linkId });
        const adminUser = await checkAdmin(ctx);

        await ctx.db.patch(args.linkId, {
            isActive: false,
            updatedAt: Date.now(),
        });

        await ctx.db.insert("auditLogs", {
            userId: adminUser._id,
            action: "note_promo.deactivate_link",
            targetType: "notePromoLinks",
            targetId: args.linkId,
            createdAt: Date.now(),
        });

        console.log("[notePromo:deactivatePromoLink] 完了");
    },
});

export const listPromoLinks = query({
    args: {},
    handler: async (ctx) => {
        console.log("[notePromo:listPromoLinks] 開始");
        await checkAdmin(ctx);

        const links = await ctx.db.query("notePromoLinks").order("desc").collect();
        console.log("[notePromo:listPromoLinks] 完了", { count: links.length });
        return links;
    },
});

export const getPromoLinkStats = query({
    args: {},
    handler: async (ctx) => {
        console.log("[notePromo:getPromoLinkStats] 開始");
        await checkAdmin(ctx);

        const trialUsers = await ctx.db.query("noteTrialUsers").collect();

        const totalTrials = trialUsers.length;
        const activeTrials = trialUsers.filter((t) => t.status === "active" || t.status === "expiring_soon").length;
        const expiredTrials = trialUsers.filter((t) => t.status === "expired").length;
        const convertedTrials = trialUsers.filter((t) => t.convertedToSubscription).length;
        const conversionRate = totalTrials > 0 ? Math.round((convertedTrials / totalTrials) * 100) : 0;

        console.log("[notePromo:getPromoLinkStats] 完了", {
            totalTrials,
            activeTrials,
            expiredTrials,
            convertedTrials,
        });
        return { totalTrials, activeTrials, expiredTrials, convertedTrials, conversionRate };
    },
});

export const getTrialUsers = query({
    args: {},
    handler: async (ctx) => {
        console.log("[notePromo:getTrialUsers] 開始");
        await checkAdmin(ctx);

        const trialUsers = await ctx.db.query("noteTrialUsers").order("desc").collect();

        const enriched = await Promise.all(
            trialUsers.map(async (trial) => {
                const user = await ctx.db.get(trial.userId);
                const promoLink = await ctx.db.get(trial.promoLinkId);
                return {
                    ...trial,
                    userName: user?.name ?? "Unknown",
                    userEmail: user?.email ?? "",
                    promoCode: promoLink?.code ?? "Unknown",
                };
            }),
        );

        console.log("[notePromo:getTrialUsers] 完了", { count: enriched.length });
        return enriched;
    },
});

// ==================== Promo Validation & Trial ====================

export const validatePromoCode = query({
    args: { code: v.string() },
    handler: async (ctx, args) => {
        console.log("[notePromo:validatePromoCode] 開始", { code: args.code });

        const link = await ctx.db
            .query("notePromoLinks")
            .withIndex("by_code", (q) => q.eq("code", args.code))
            .first();

        if (!link) {
            console.log("[notePromo:validatePromoCode] リンク未検出");
            return { valid: false, reason: "invalid_code" };
        }

        if (!link.isActive) {
            console.log("[notePromo:validatePromoCode] リンク無効");
            return { valid: false, reason: "inactive" };
        }

        if (link.currentRedemptions >= link.maxRedemptions) {
            console.log("[notePromo:validatePromoCode] 使用回数上限");
            return { valid: false, reason: "max_redemptions" };
        }

        if (link.expiresAt && Date.now() > link.expiresAt) {
            console.log("[notePromo:validatePromoCode] 有効期限切れ");
            return { valid: false, reason: "expired" };
        }

        console.log("[notePromo:validatePromoCode] 有効");
        return { valid: true };
    },
});

export const checkIpUsed = query({
    args: {
        ipHash: v.string(),
        secret: v.string(),
    },
    handler: async (ctx, args) => {
        console.log("[notePromo:checkIpUsed] 開始");
        validateInternalSecret(args.secret);

        const existing = await ctx.db
            .query("noteTrialUsers")
            .withIndex("by_ip_hash", (q) => q.eq("ipHash", args.ipHash))
            .first();

        console.log("[notePromo:checkIpUsed] 完了", { used: !!existing });
        return !!existing;
    },
});

export const activateNoteTrial = mutation({
    args: {
        clerkId: v.string(),
        promoCode: v.string(),
        ipAddress: v.string(),
        ipHash: v.string(),
        discordId: v.string(),
        secret: v.string(),
    },
    handler: async (ctx, args) => {
        console.log("[notePromo:activateNoteTrial] 開始", { clerkId: args.clerkId });
        validateInternalSecret(args.secret);

        // 1. Find user
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
            .first();
        if (!user) throw new Error("User not found");

        // 2. Check if user already has an active subscription
        if (user.subscriptionStatus === "active" || user.subscriptionStatus === "note_trial") {
            throw new Error("User already has an active subscription or trial");
        }

        // 3. Check for existing trial by this user
        const existingTrial = await ctx.db
            .query("noteTrialUsers")
            .withIndex("by_user_id", (q) => q.eq("userId", user._id))
            .first();
        if (existingTrial) throw new Error("User has already used a trial");

        // 4. Check IP
        const ipUsed = await ctx.db
            .query("noteTrialUsers")
            .withIndex("by_ip_hash", (q) => q.eq("ipHash", args.ipHash))
            .first();
        if (ipUsed) throw new Error("This IP has already been used for a trial");

        // 5. Validate promo code
        const link = await ctx.db
            .query("notePromoLinks")
            .withIndex("by_code", (q) => q.eq("code", args.promoCode))
            .first();
        if (!link || !link.isActive) throw new Error("Invalid or inactive promo code");
        if (link.currentRedemptions >= link.maxRedemptions) throw new Error("Promo code max redemptions reached");
        if (link.expiresAt && Date.now() > link.expiresAt) throw new Error("Promo code expired");

        // 6. Activate trial
        const now = Date.now();
        const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
        const TWENTY_THREE_DAYS = 23 * 24 * 60 * 60 * 1000;
        const trialExpiresAt = now + THIRTY_DAYS;

        const trialId = await ctx.db.insert("noteTrialUsers", {
            userId: user._id,
            promoLinkId: link._id,
            ipAddress: args.ipAddress,
            ipHash: args.ipHash,
            status: "active",
            trialStartedAt: now,
            trialExpiresAt,
            convertedToSubscription: false,
            createdAt: now,
        });

        // 7. Update user subscription status
        await ctx.db.patch(user._id, {
            subscriptionStatus: "note_trial",
            discordId: args.discordId,
            updatedAt: now,
        });

        // 8. Increment redemptions
        await ctx.db.patch(link._id, {
            currentRedemptions: link.currentRedemptions + 1,
            updatedAt: now,
        });

        // 9. Schedule warning at 23 days
        await ctx.scheduler.runAt(now + TWENTY_THREE_DAYS, internal.notePromo.markTrialExpiringSoon, {
            trialId,
        });

        // 10. Schedule expiration at 30 days
        await ctx.scheduler.runAt(trialExpiresAt, internal.notePromo.expireNoteTrial, {
            trialId,
        });

        // 11. Audit log
        await ctx.db.insert("auditLogs", {
            userId: user._id,
            action: "note_trial.activate",
            targetType: "noteTrialUsers",
            targetId: trialId,
            details: `promoCode=${args.promoCode}, expiresAt=${new Date(trialExpiresAt).toISOString()}`,
            createdAt: now,
        });

        console.log("[notePromo:activateNoteTrial] 完了", { trialId, userId: user._id });
        return { trialId, trialExpiresAt };
    },
});

export const getTrialStatus = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const user = await getUserByClerkId(ctx, identity.subject);
        if (!user) return null;

        const trial = await ctx.db
            .query("noteTrialUsers")
            .withIndex("by_user_id", (q) => q.eq("userId", user._id))
            .first();

        if (!trial) return null;

        const daysRemaining = Math.max(0, Math.ceil((trial.trialExpiresAt - Date.now()) / (24 * 60 * 60 * 1000)));

        return {
            status: trial.status,
            trialStartedAt: trial.trialStartedAt,
            trialExpiresAt: trial.trialExpiresAt,
            daysRemaining,
            convertedToSubscription: trial.convertedToSubscription,
        };
    },
});

// ==================== Internal Scheduled Functions ====================

export const markTrialExpiringSoon = internalMutation({
    args: { trialId: v.id("noteTrialUsers") },
    handler: async (ctx, args) => {
        console.log("[notePromo:markTrialExpiringSoon] 開始", { trialId: args.trialId });

        const trial = await ctx.db.get(args.trialId);
        if (!trial) return;
        if (trial.status !== "active") return; // Already expired or converted
        if (trial.convertedToSubscription) return;

        await ctx.db.patch(args.trialId, {
            status: "expiring_soon",
            warningShownAt: Date.now(),
        });

        console.log("[notePromo:markTrialExpiringSoon] 完了", { trialId: args.trialId });
    },
});

export const expireNoteTrial = internalMutation({
    args: { trialId: v.id("noteTrialUsers") },
    handler: async (ctx, args) => {
        console.log("[notePromo:expireNoteTrial] 開始", { trialId: args.trialId });

        const trial = await ctx.db.get(args.trialId);
        if (!trial) return;
        if (trial.convertedToSubscription) return;
        if (trial.status === "expired") return;

        const now = Date.now();

        // Update trial status
        await ctx.db.patch(args.trialId, {
            status: "expired",
            expiredAt: now,
        });

        // Update user subscription status
        const user = await ctx.db.get(trial.userId);
        if (user && user.subscriptionStatus === "note_trial") {
            await ctx.db.patch(trial.userId, {
                subscriptionStatus: "inactive",
                updatedAt: now,
            });
        }

        // Audit log
        await ctx.db.insert("auditLogs", {
            userId: trial.userId,
            action: "note_trial.expired",
            targetType: "noteTrialUsers",
            targetId: args.trialId,
            createdAt: now,
        });

        // Schedule expiration email
        await ctx.scheduler.runAfter(0, internal.notePromoEmail.sendTrialExpiredEmail, {
            trialId: args.trialId,
        });

        console.log("[notePromo:expireNoteTrial] 完了", { trialId: args.trialId, userId: trial.userId });
    },
});

export const markTrialConverted = internalMutation({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        console.log("[notePromo:markTrialConverted] 開始", { userId: args.userId });

        const trial = await ctx.db
            .query("noteTrialUsers")
            .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
            .first();

        if (!trial) {
            console.log("[notePromo:markTrialConverted] トライアル未検出");
            return;
        }

        await ctx.db.patch(trial._id, {
            convertedToSubscription: true,
            status: "expired", // Mark as expired since they converted
        });

        // Audit log
        await ctx.db.insert("auditLogs", {
            userId: args.userId,
            action: "note_trial.converted",
            targetType: "noteTrialUsers",
            targetId: trial._id,
            details: "Converted to paid subscription",
            createdAt: Date.now(),
        });

        console.log("[notePromo:markTrialConverted] 完了", { trialId: trial._id });
    },
});

// Internal query: トライアルとユーザー情報を取得 (nodeアクションから呼び出し用)
export const getTrialWithUser = internalQuery({
    args: { trialId: v.id("noteTrialUsers") },
    handler: async (ctx, args) => {
        const trial = await ctx.db.get(args.trialId);
        if (!trial) return null;

        const user = await ctx.db.get(trial.userId);
        if (!user) return null;

        return {
            trialId: trial._id,
            userId: trial.userId,
            status: trial.status,
            convertedToSubscription: trial.convertedToSubscription,
            userName: user.name,
            userEmail: user.email,
        };
    },
});

// Cron fallback: check all expiring trials
export const cronCheckExpiringTrials = internalMutation({
    args: {},
    handler: async (ctx) => {
        console.log("[notePromo:cronCheckExpiringTrials] 開始");
        const now = Date.now();
        const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

        // Find active trials that should be marked as expiring_soon
        const activeTrials = await ctx.db
            .query("noteTrialUsers")
            .withIndex("by_status", (q) => q.eq("status", "active"))
            .collect();

        for (const trial of activeTrials) {
            if (trial.trialExpiresAt - now <= SEVEN_DAYS) {
                await ctx.db.patch(trial._id, {
                    status: "expiring_soon",
                    warningShownAt: now,
                });
                console.log("[notePromo:cronCheckExpiringTrials] expiring_soon に更新", { trialId: trial._id });
            }
        }

        // Find trials that should be expired
        const expiringTrials = await ctx.db
            .query("noteTrialUsers")
            .withIndex("by_status", (q) => q.eq("status", "expiring_soon"))
            .collect();

        for (const trial of expiringTrials) {
            if (now >= trial.trialExpiresAt && !trial.convertedToSubscription) {
                await ctx.db.patch(trial._id, {
                    status: "expired",
                    expiredAt: now,
                });

                const user = await ctx.db.get(trial.userId);
                if (user && user.subscriptionStatus === "note_trial") {
                    await ctx.db.patch(trial.userId, {
                        subscriptionStatus: "inactive",
                        updatedAt: now,
                    });
                }

                await ctx.db.insert("auditLogs", {
                    userId: trial.userId,
                    action: "note_trial.expired_by_cron",
                    targetType: "noteTrialUsers",
                    targetId: trial._id,
                    createdAt: now,
                });

                console.log("[notePromo:cronCheckExpiringTrials] expired に更新", { trialId: trial._id });
            }
        }

        // Also check active trials that expired (missed the scheduler)
        for (const trial of activeTrials) {
            if (now >= trial.trialExpiresAt && !trial.convertedToSubscription) {
                await ctx.db.patch(trial._id, {
                    status: "expired",
                    expiredAt: now,
                });

                const user = await ctx.db.get(trial.userId);
                if (user && user.subscriptionStatus === "note_trial") {
                    await ctx.db.patch(trial.userId, {
                        subscriptionStatus: "inactive",
                        updatedAt: now,
                    });
                }

                console.log("[notePromo:cronCheckExpiringTrials] active→expired (missed scheduler)", {
                    trialId: trial._id,
                });
            }
        }

        console.log("[notePromo:cronCheckExpiringTrials] 完了");
    },
});
