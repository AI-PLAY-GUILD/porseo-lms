import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { DatabaseReader, MutationCtx } from "./_generated/server";
import { internalMutation, mutation, query } from "./_generated/server";
import { safeCompare } from "./lib/safeCompare";

// Issue #59: Audit log helper — records user mutations for compliance
async function writeAuditLog(
    ctx: MutationCtx,
    userId: Id<"users">,
    action: string,
    targetType: string,
    targetId?: string,
    details?: string,
) {
    try {
        console.log("[users:writeAuditLog] 開始", { userId, action, targetType, targetId });
        await ctx.db.insert("auditLogs", {
            userId,
            action,
            targetType,
            targetId,
            details,
            createdAt: Date.now(),
        });
    } catch (e) {
        // Audit logging should never break the main operation
        console.error("[users:writeAuditLog] エラー:", e);
    }
}

export const webhookSyncUser = mutation({
    args: {
        clerkId: v.string(),
        email: v.string(),
        name: v.string(),
        imageUrl: v.optional(v.string()),
        secret: v.string(),
    },
    handler: async (ctx, args) => {
        console.log("[users:webhookSyncUser] 開始", { clerkId: args.clerkId, email: args.email });
        if (!safeCompare(args.secret, process.env.CLERK_WEBHOOK_SECRET || "")) {
            console.log("[users:webhookSyncUser] 認証失敗: 無効なsecret");
            throw new Error("Unauthorized: Invalid secret");
        }

        let existing = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
            .first();

        // If not found by Clerk ID, check if there's a migrated user with the same email
        if (!existing) {
            console.log("[users:webhookSyncUser] ClerkIDでユーザー未検出、メールで検索", { email: args.email });
            const existingByEmail = await ctx.db
                .query("users")
                .filter((q) => q.eq(q.field("email"), args.email))
                .first();

            // Issue #60: Only merge if the existing user has no clerkId (migrated user)
            // Prevents account takeover via email address reuse
            if (existingByEmail && !existingByEmail.clerkId) {
                console.log("[users:webhookSyncUser] 移行ユーザーをマージ", { emailUserId: existingByEmail._id });
                existing = existingByEmail;
            }
        }

        const isAdmin = args.clerkId === process.env.ADMIN_CLERK_ID;

        // PII logs removed for security (Issue #20)

        if (existing) {
            console.log("[users:webhookSyncUser] 既存ユーザーを更新", { userId: existing._id });
            await ctx.db.patch(existing._id, {
                clerkId: args.clerkId, // Ensure Clerk ID is updated (crucial for migration linking)
                email: args.email,
                name: args.name,
                imageUrl: args.imageUrl,
                isAdmin: existing.isAdmin || isAdmin,
                updatedAt: Date.now(),
            });
            await writeAuditLog(ctx, existing._id, "user.sync", "user", existing._id, "Webhook sync update");
            console.log("[users:webhookSyncUser] 完了 (更新)", { userId: existing._id });
            return existing._id;
        } else {
            console.log("[users:webhookSyncUser] 新規ユーザーを作成", { clerkId: args.clerkId });
            const newUserId = await ctx.db.insert("users", {
                clerkId: args.clerkId,
                email: args.email,
                name: args.name,
                imageUrl: args.imageUrl,
                discordRoles: [],
                isAdmin,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
            await writeAuditLog(ctx, newUserId, "user.create", "user", newUserId, "Webhook sync create");
            console.log("[users:webhookSyncUser] 完了 (新規作成)", { userId: newUserId });
            return newUserId;
        }
    },
});

export const getUser = query({
    handler: async (ctx) => {
        console.log("[users:getUser] 開始");
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            console.log("[users:getUser] 未認証ユーザー");
            return null;
        }

        console.log("[users:getUser] 完了", { clerkId: identity.subject });
        return await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();
    },
});

// Security: internalMutation - only callable from server-side Convex actions (e.g. stripe.ts)
// Prevents users from setting arbitrary Discord roles on themselves (privilege escalation)
export const updateDiscordRoles = internalMutation({
    args: {
        clerkId: v.string(),
        discordRoles: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        console.log("[users:updateDiscordRoles] 開始", { clerkId: args.clerkId, rolesCount: args.discordRoles.length });
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
            .first();

        if (!user) {
            console.log("[users:updateDiscordRoles] ユーザー未検出", { clerkId: args.clerkId });
            throw new Error("User not found");
        }

        await ctx.db.patch(user._id, {
            discordRoles: args.discordRoles,
            updatedAt: Date.now(),
        });
        await writeAuditLog(ctx, user._id, "user.discord_roles_update", "user", user._id);
        console.log("[users:updateDiscordRoles] 完了", { userId: user._id, rolesCount: args.discordRoles.length });
    },
});

export const checkAccess = query({
    args: { videoId: v.id("videos") },
    handler: async (ctx, args) => {
        console.log("[users:checkAccess] 開始", { videoId: args.videoId });
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            console.log("[users:checkAccess] 未認証ユーザー");
            return { hasAccess: false };
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        const video = await ctx.db.get(args.videoId);
        if (!video || !user) {
            console.log("[users:checkAccess] 動画またはユーザー未検出", { videoFound: !!video, userFound: !!user });
            return { hasAccess: false };
        }

        // 管理者は全てアクセス可能
        if (user.isAdmin) {
            console.log("[users:checkAccess] 完了 (管理者アクセス)", { userId: user._id });
            return { hasAccess: true };
        }

        // 必要なロールをチェック
        // 動画にロール制限がない場合はアクセス可能とする（要件によるが、今回は制限あり前提）
        if (!video.requiredRoles || video.requiredRoles.length === 0) return { hasAccess: true };

        const hasRequiredRole = video.requiredRoles.some((role) => user.discordRoles.includes(role));

        console.log("[users:checkAccess] 完了", { userId: user._id, hasAccess: hasRequiredRole });
        return { hasAccess: hasRequiredRole };
    },
});

export const getUserByClerkId = async (ctx: { db: DatabaseReader }, clerkId: string) => {
    return await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
        .first();
};
// Server-to-server query: Clerk IDでユーザーを取得（ConvexHttpClientから呼び出し用）
// Security: CONVEX_INTERNAL_SECRET で認証（ctx.authが使えないため）
export const getUserByClerkIdServer = query({
    args: {
        clerkId: v.string(),
        secret: v.string(),
    },
    handler: async (ctx, args) => {
        console.log("[users:getUserByClerkIdServer] 開始", { clerkId: args.clerkId });
        if (!safeCompare(args.secret, process.env.CONVEX_INTERNAL_SECRET || "")) {
            console.log("[users:getUserByClerkIdServer] 認証失敗: 無効なsecret");
            throw new Error("Unauthorized: Invalid secret");
        }

        const result = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
            .first();
        console.log("[users:getUserByClerkIdServer] 完了", { found: !!result });
        return result;
    },
});

// 1. Stripe Customer IDからユーザーを取得
// Security: Uses dedicated CONVEX_INTERNAL_SECRET (separated from CLERK_WEBHOOK_SECRET per Issue #4)
export const getUserByStripeCustomerId = query({
    args: {
        stripeCustomerId: v.string(),
        secret: v.string(),
    },
    handler: async (ctx, args) => {
        console.log("[users:getUserByStripeCustomerId] 開始", { stripeCustomerId: args.stripeCustomerId });
        if (!safeCompare(args.secret, process.env.CONVEX_INTERNAL_SECRET || "")) {
            console.log("[users:getUserByStripeCustomerId] 認証失敗: 無効なsecret");
            throw new Error("Unauthorized: Invalid secret");
        }

        const result = await ctx.db
            .query("users")
            .withIndex("by_stripe_customer_id", (q) => q.eq("stripeCustomerId", args.stripeCustomerId))
            .first();
        console.log("[users:getUserByStripeCustomerId] 完了", { found: !!result });
        return result;
    },
});

// 2. Discord IDを使ってサブスクリプション状態を更新（決済成功時）
export const updateSubscriptionStatus = mutation({
    args: {
        discordId: v.string(),
        stripeCustomerId: v.optional(v.string()),
        subscriptionStatus: v.string(),
        subscriptionName: v.optional(v.string()),
        roleId: v.optional(v.string()),
        secret: v.string(),
    },
    handler: async (ctx, args) => {
        console.log("[users:updateSubscriptionStatus] 開始", {
            discordId: args.discordId,
            subscriptionStatus: args.subscriptionStatus,
        });
        if (!safeCompare(args.secret, process.env.CONVEX_INTERNAL_SECRET || "")) {
            console.log("[users:updateSubscriptionStatus] 認証失敗: 無効なsecret");
            throw new Error("Unauthorized: Invalid secret");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_discord_id", (q) => q.eq("discordId", args.discordId))
            .first();

        if (!user) {
            console.log("[users:updateSubscriptionStatus] ユーザー未検出", { discordId: args.discordId });
            throw new Error(`User with Discord ID ${args.discordId} not found`);
        }

        // ロールIDがあれば、既存のリストに追加する（重複チェック付き）
        let newRoles = user.discordRoles || [];
        if (args.roleId && !newRoles.includes(args.roleId)) {
            newRoles = [...newRoles, args.roleId];
        }

        const patchData: {
            subscriptionStatus: string;
            discordRoles: string[];
            updatedAt: number;
            subscriptionName?: string;
            stripeCustomerId?: string;
        } = {
            subscriptionStatus: args.subscriptionStatus,
            discordRoles: newRoles,
            updatedAt: Date.now(),
        };

        if (args.subscriptionName) {
            patchData.subscriptionName = args.subscriptionName;
        }

        if (args.stripeCustomerId) {
            patchData.stripeCustomerId = args.stripeCustomerId;
        }

        await ctx.db.patch(user._id, patchData);
        await writeAuditLog(
            ctx,
            user._id,
            "subscription.update",
            "user",
            user._id,
            `status=${args.subscriptionStatus}`,
        );
        console.log("[users:updateSubscriptionStatus] 完了", {
            userId: user._id,
            subscriptionStatus: args.subscriptionStatus,
        });
    },
});

// 3. Stripe Customer IDを使ってサブスクリプション状態を更新（キャンセル/失敗時）
export const updateSubscriptionStatusByCustomerId = mutation({
    args: {
        stripeCustomerId: v.string(),
        subscriptionStatus: v.string(),
        secret: v.string(),
    },
    handler: async (ctx, args) => {
        console.log("[users:updateSubscriptionStatusByCustomerId] 開始", {
            stripeCustomerId: args.stripeCustomerId,
            subscriptionStatus: args.subscriptionStatus,
        });
        if (!safeCompare(args.secret, process.env.CONVEX_INTERNAL_SECRET || "")) {
            console.log("[users:updateSubscriptionStatusByCustomerId] 認証失敗: 無効なsecret");
            throw new Error("Unauthorized: Invalid secret");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_stripe_customer_id", (q) => q.eq("stripeCustomerId", args.stripeCustomerId))
            .first();

        if (!user) {
            // Issue #61: Log warning instead of silently returning
            console.warn(
                `[updateSubscriptionStatusByCustomerId] User not found for stripeCustomerId: ${args.stripeCustomerId}`,
            );
            return;
        }

        await ctx.db.patch(user._id, {
            subscriptionStatus: args.subscriptionStatus,
        });
        await writeAuditLog(
            ctx,
            user._id,
            "subscription.update_by_customer",
            "user",
            user._id,
            `status=${args.subscriptionStatus}`,
        );
        console.log("[users:updateSubscriptionStatusByCustomerId] 完了", {
            userId: user._id,
            subscriptionStatus: args.subscriptionStatus,
        });
    },
});

// 4. ユーザー情報を保存・更新（Entryアプリ用）
// Security: discordId removed from client args (Issue #16) - should only be set server-side
export const storeUser = mutation({
    args: {
        clerkId: v.string(),
        email: v.string(),
        name: v.string(),
        imageUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        console.log("[users:storeUser] 開始", { clerkId: args.clerkId });
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            console.log("[users:storeUser] 未認証ユーザー");
            throw new Error("Unauthorized");
        }
        if (identity.subject !== args.clerkId) {
            console.log("[users:storeUser] 認証失敗: clerkId不一致");
            throw new Error("Unauthorized: You can only update your own profile");
        }

        // 1. Check by Clerk ID
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
            .first();

        if (user) {
            console.log("[users:storeUser] 既存ユーザーを更新", { userId: user._id });
            await ctx.db.patch(user._id, {
                email: args.email,
                name: args.name,
                imageUrl: args.imageUrl,
                updatedAt: Date.now(),
            });
            console.log("[users:storeUser] 完了 (更新)", { userId: user._id });
            return user._id;
        }

        // 2. Check by Email (Fix for migration/linking)
        const existingByEmail = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("email"), args.email))
            .first();

        // Issue #60: Only merge if the existing user has no clerkId (migrated user)
        if (existingByEmail && !existingByEmail.clerkId) {
            console.log("[users:storeUser] 移行ユーザーをメールでリンク", { emailUserId: existingByEmail._id });
            await ctx.db.patch(existingByEmail._id, {
                clerkId: args.clerkId, // Link Clerk ID
                name: args.name,
                imageUrl: args.imageUrl,
                updatedAt: Date.now(),
            });
            await writeAuditLog(ctx, existingByEmail._id, "user.link_by_email", "user", existingByEmail._id);
            console.log("[users:storeUser] 完了 (メールリンク)", { userId: existingByEmail._id });
            return existingByEmail._id;
        }

        // 3. Create New User
        console.log("[users:storeUser] 新規ユーザーを作成", { clerkId: args.clerkId });
        const userId = await ctx.db.insert("users", {
            clerkId: args.clerkId,
            email: args.email,
            name: args.name,
            imageUrl: args.imageUrl,
            discordRoles: [],
            isAdmin: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
        await writeAuditLog(ctx, userId, "user.create", "user", userId, "storeUser create");
        console.log("[users:storeUser] 完了 (新規作成)", { userId });
        return userId;
    },
});

// Security: Requires authentication. Users can only query their own data, admins can query any user.
export const getUserByClerkIdQuery = query({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        console.log("[users:getUserByClerkIdQuery] 開始", { clerkId: args.clerkId });
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            console.log("[users:getUserByClerkIdQuery] 未認証ユーザー");
            throw new Error("Unauthorized");
        }

        // Allow querying own data or admin access
        if (identity.subject !== args.clerkId) {
            console.log("[users:getUserByClerkIdQuery] 他ユーザーのデータにアクセス、管理者チェック");
            const currentUser = await getUserByClerkId(ctx, identity.subject);
            if (!currentUser?.isAdmin) {
                console.log("[users:getUserByClerkIdQuery] 管理者権限なし");
                throw new Error("Unauthorized: You can only access your own data");
            }
        }

        const result = await getUserByClerkId(ctx, args.clerkId);
        console.log("[users:getUserByClerkIdQuery] 完了", { found: !!result });
        return result;
    },
});

export const getAllUsers = query({
    handler: async (ctx) => {
        console.log("[users:getAllUsers] 開始");
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            console.log("[users:getAllUsers] 未認証ユーザー");
            return [];
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user || !user.isAdmin) {
            console.log("[users:getAllUsers] 管理者権限なし");
            throw new Error("Unauthorized");
        }

        const result = await ctx.db.query("users").order("desc").collect();
        console.log("[users:getAllUsers] 完了", { userCount: result.length });
        return result;
    },
});

export const syncCurrentUser = mutation({
    args: {},
    handler: async (ctx) => {
        console.log("[users:syncCurrentUser] 開始");
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            console.log("[users:syncCurrentUser] 未認証ユーザー");
            throw new Error("Called syncCurrentUser without authentication");
        }

        const clerkId = identity.subject;
        const email = identity.email;
        const name = identity.name || identity.nickname || "Anonymous";
        const imageUrl = identity.pictureUrl;

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
            .first();

        if (user) {
            // User already exists, update if needed (optional, but good for consistency)
            // For now, we just return the ID as the goal is to ensure existence
            console.log("[users:syncCurrentUser] 完了 (既存ユーザー)", { userId: user._id });
            return user._id;
        }

        // Check by email to avoid duplicates if migration happened
        if (email) {
            const existingByEmail = await ctx.db
                .query("users")
                .filter((q) => q.eq(q.field("email"), email))
                .first();
            // Issue #60: Only merge if the existing user has no clerkId (migrated user)
            if (existingByEmail && !existingByEmail.clerkId) {
                console.log("[users:syncCurrentUser] 移行ユーザーをマージ", { emailUserId: existingByEmail._id });
                await ctx.db.patch(existingByEmail._id, {
                    clerkId: clerkId,
                    name: name,
                    imageUrl: imageUrl,
                    updatedAt: Date.now(),
                });
                console.log("[users:syncCurrentUser] 完了 (メールマージ)", { userId: existingByEmail._id });
                return existingByEmail._id;
            }
        }

        // Create new user
        console.log("[users:syncCurrentUser] 新規ユーザーを作成", { clerkId });
        const newUserId = await ctx.db.insert("users", {
            clerkId: clerkId,
            email: email || "",
            name: name,
            imageUrl: imageUrl,
            discordRoles: [],
            isAdmin: false, // Default to false
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        console.log("[users:syncCurrentUser] 完了 (新規作成)", { userId: newUserId });
        return newUserId;
    },
});

// Stripe webhook idempotency check (Issue #53)
export const checkStripeEventProcessed = query({
    args: {
        eventId: v.string(),
        secret: v.string(),
    },
    handler: async (ctx, args) => {
        console.log("[users:checkStripeEventProcessed] 開始", { eventId: args.eventId });
        if (!safeCompare(args.secret, process.env.CONVEX_INTERNAL_SECRET || "")) {
            console.log("[users:checkStripeEventProcessed] 認証失敗: 無効なsecret");
            throw new Error("Unauthorized: Invalid secret");
        }
        const existing = await ctx.db
            .query("processedStripeEvents")
            .withIndex("by_event_id", (q) => q.eq("eventId", args.eventId))
            .first();
        console.log("[users:checkStripeEventProcessed] 完了", { eventId: args.eventId, alreadyProcessed: !!existing });
        return !!existing;
    },
});

export const markStripeEventProcessed = mutation({
    args: {
        eventId: v.string(),
        eventType: v.string(),
        secret: v.string(),
    },
    handler: async (ctx, args) => {
        console.log("[users:markStripeEventProcessed] 開始", { eventId: args.eventId, eventType: args.eventType });
        if (!safeCompare(args.secret, process.env.CONVEX_INTERNAL_SECRET || "")) {
            console.log("[users:markStripeEventProcessed] 認証失敗: 無効なsecret");
            throw new Error("Unauthorized: Invalid secret");
        }
        await ctx.db.insert("processedStripeEvents", {
            eventId: args.eventId,
            eventType: args.eventType,
            processedAt: Date.now(),
        });
        console.log("[users:markStripeEventProcessed] 完了", { eventId: args.eventId });
    },
});

// Security: Admin-only to prevent user enumeration attacks
export const checkUserByEmail = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        const currentUser = await getUserByClerkId(ctx, identity.subject);
        if (!currentUser?.isAdmin) throw new Error("Admin access required");

        const user = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("email"), args.email))
            .first();
        return !!user;
    },
});
