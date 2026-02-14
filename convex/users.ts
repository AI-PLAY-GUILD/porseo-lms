import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Constant-time string comparison to prevent timing attacks on secret verification.
// Convex V8 isolate doesn't have crypto.timingSafeEqual, so we use a pure JS implementation.
function safeCompare(a: string, b: string): boolean {
    const len = Math.max(a.length, b.length);
    let result = a.length ^ b.length;
    for (let i = 0; i < len; i++) {
        result |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
    }
    return result === 0;
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
        if (!safeCompare(args.secret, process.env.CLERK_WEBHOOK_SECRET || "")) {
            throw new Error("Unauthorized: Invalid secret");
        }

        let existing = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
            .first();

        // If not found by Clerk ID, check if there's a migrated user with the same email
        if (!existing) {
            const existingByEmail = await ctx.db
                .query("users")
                .filter((q) => q.eq(q.field("email"), args.email))
                .first();

            // Only link if the existing user looks like a migrated user (e.g. has a placeholder Clerk ID or we just trust the email)
            // For safety, let's assume if the email matches and we are creating a new Clerk link, we merge.
            if (existingByEmail) {
                existing = existingByEmail;
            }
        }

        const isAdmin = args.clerkId === process.env.ADMIN_CLERK_ID;

        // PII logs removed for security (Issue #20)

        if (existing) {
            await ctx.db.patch(existing._id, {
                clerkId: args.clerkId, // Ensure Clerk ID is updated (crucial for migration linking)
                email: args.email,
                name: args.name,
                imageUrl: args.imageUrl,
                isAdmin: existing.isAdmin || isAdmin,
                updatedAt: Date.now(),
            });
            return existing._id;
        } else {
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
            return newUserId;
        }
    },
});

export const getUser = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

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
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
            .first();

        if (!user) {
            throw new Error("User not found");
        }

        await ctx.db.patch(user._id, {
            discordRoles: args.discordRoles,
            updatedAt: Date.now(),
        });
    },
});

export const checkAccess = query({
    args: { videoId: v.id("videos") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return { hasAccess: false };

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        const video = await ctx.db.get(args.videoId);
        if (!video || !user) return { hasAccess: false };

        // 管理者は全てアクセス可能
        if (user.isAdmin) return { hasAccess: true };

        // 必要なロールをチェック
        // 動画にロール制限がない場合はアクセス可能とする（要件によるが、今回は制限あり前提）
        if (!video.requiredRoles || video.requiredRoles.length === 0) return { hasAccess: true };

        const hasRequiredRole = video.requiredRoles.some(role =>
            user.discordRoles.includes(role)
        );

        return { hasAccess: hasRequiredRole };
    },
});

export const getUserByClerkId = async (ctx: any, clerkId: string) => {
    return await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", clerkId))
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
        if (!safeCompare(args.secret, process.env.CONVEX_INTERNAL_SECRET || "")) {
            throw new Error("Unauthorized: Invalid secret");
        }

        return await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
            .first();
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
        if (!safeCompare(args.secret, process.env.CONVEX_INTERNAL_SECRET || "")) {
            throw new Error("Unauthorized: Invalid secret");
        }

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
        stripeCustomerId: v.optional(v.string()),
        subscriptionStatus: v.string(),
        subscriptionName: v.optional(v.string()),
        roleId: v.optional(v.string()),
        secret: v.string(),
    },
    handler: async (ctx, args) => {
        if (!safeCompare(args.secret, process.env.CONVEX_INTERNAL_SECRET || "")) {
            throw new Error("Unauthorized: Invalid secret");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_discord_id", (q) => q.eq("discordId", args.discordId))
            .first();

        if (!user) {
            throw new Error(`User with Discord ID ${args.discordId} not found`);
        }

        // ロールIDがあれば、既存のリストに追加する（重複チェック付き）
        let newRoles = user.discordRoles || [];
        if (args.roleId && !newRoles.includes(args.roleId)) {
            newRoles = [...newRoles, args.roleId];
        }

        const patchData: any = {
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
        if (!safeCompare(args.secret, process.env.CONVEX_INTERNAL_SECRET || "")) {
            throw new Error("Unauthorized: Invalid secret");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_stripe_customer_id", (q) => q.eq("stripeCustomerId", args.stripeCustomerId))
            .first();

        if (!user) {
            // Issue #61: Log warning instead of silently returning
            console.warn(`[updateSubscriptionStatusByCustomerId] User not found for stripeCustomerId: ${args.stripeCustomerId}`);
            return;
        }

        await ctx.db.patch(user._id, {
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
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized");
        }
        if (identity.subject !== args.clerkId) {
            throw new Error("Unauthorized: You can only update your own profile");
        }

        // 1. Check by Clerk ID
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
            .first();

        if (user) {
            await ctx.db.patch(user._id, {
                email: args.email,
                name: args.name,
                imageUrl: args.imageUrl,
                updatedAt: Date.now(),
            });
            return user._id;
        }

        // 2. Check by Email (Fix for migration/linking)
        const existingByEmail = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("email"), args.email))
            .first();

        if (existingByEmail) {
            // PII log removed (Issue #20)
            await ctx.db.patch(existingByEmail._id, {
                clerkId: args.clerkId, // Link Clerk ID
                name: args.name,
                imageUrl: args.imageUrl,
                updatedAt: Date.now(),
            });
            return existingByEmail._id;
        }

        // 3. Create New User
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
        return userId;
    },
});

// Security: Requires authentication. Users can only query their own data, admins can query any user.
export const getUserByClerkIdQuery = query({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        // Allow querying own data or admin access
        if (identity.subject !== args.clerkId) {
            const currentUser = await getUserByClerkId(ctx, identity.subject);
            if (!currentUser?.isAdmin) {
                throw new Error("Unauthorized: You can only access your own data");
            }
        }

        return await getUserByClerkId(ctx, args.clerkId);
    },
});

export const getAllUsers = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user || !user.isAdmin) {
            throw new Error("Unauthorized");
        }

        return await ctx.db.query("users").order("desc").collect();
    },
});

export const syncCurrentUser = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Called syncCurrentUser without authentication");
        }

        const clerkId = identity.subject;
        const email = identity.email;
        const name = identity.name || identity.nickname || "Anonymous";
        const imageUrl = identity.pictureUrl;

        let user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
            .first();

        if (user) {
            // User already exists, update if needed (optional, but good for consistency)
            // For now, we just return the ID as the goal is to ensure existence
            return user._id;
        }

        // Check by email to avoid duplicates if migration happened
        if (email) {
            const existingByEmail = await ctx.db
                .query("users")
                .filter((q) => q.eq(q.field("email"), email))
                .first();
            if (existingByEmail) {
                await ctx.db.patch(existingByEmail._id, {
                    clerkId: clerkId,
                    name: name,
                    imageUrl: imageUrl,
                    updatedAt: Date.now(),
                });
                return existingByEmail._id;
            }
        }

        // Create new user
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
        if (!safeCompare(args.secret, process.env.CONVEX_INTERNAL_SECRET || "")) {
            throw new Error("Unauthorized: Invalid secret");
        }
        const existing = await ctx.db
            .query("processedStripeEvents")
            .withIndex("by_event_id", (q) => q.eq("eventId", args.eventId))
            .first();
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
        if (!safeCompare(args.secret, process.env.CONVEX_INTERNAL_SECRET || "")) {
            throw new Error("Unauthorized: Invalid secret");
        }
        await ctx.db.insert("processedStripeEvents", {
            eventId: args.eventId,
            eventType: args.eventType,
            processedAt: Date.now(),
        });
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