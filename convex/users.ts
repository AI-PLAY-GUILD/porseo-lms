import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const webhookSyncUser = mutation({
    args: {
        clerkId: v.string(),
        email: v.string(),
        name: v.string(),
        imageUrl: v.optional(v.string()),
        secret: v.string(),
    },
    handler: async (ctx, args) => {
        if (args.secret !== process.env.CLERK_WEBHOOK_SECRET) {
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
                console.log(`Found existing user by email ${args.email}. Linking to Clerk ID ${args.clerkId}`);
                existing = existingByEmail;
            }
        }

        const isAdmin = args.clerkId === process.env.ADMIN_CLERK_ID;

        console.log("Syncing user:", args.clerkId);
        console.log("Is Admin?:", isAdmin);

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

export const updateDiscordRoles = mutation({
    args: {
        clerkId: v.string(),
        discordRoles: v.array(v.string()),
        secret: v.optional(v.string()), // Added secret for webhook/admin script access
    },
    handler: async (ctx, args) => {
        // Security Check: Require Secret or Admin
        if (args.secret !== process.env.CLERK_WEBHOOK_SECRET) {
            const identity = await ctx.auth.getUserIdentity();
            if (!identity) throw new Error("Unauthorized");
            const adminUser = await ctx.db
                .query("users")
                .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
                .first();
            if (!adminUser?.isAdmin) throw new Error("Unauthorized: Admin access required");
        }

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
// ▼▼▼ 以下をファイルの末尾に追加してください ▼▼▼

// 1. Stripe Customer IDからユーザーを取得
export const getUserByStripeCustomerId = query({
    args: {
        stripeCustomerId: v.string(),
        secret: v.optional(v.string()), // Optional to allow internal calls if needed, but we enforce check
    },
    handler: async (ctx, args) => {
        // Require secret for public access via client (webhook)
        if (args.secret !== process.env.CLERK_WEBHOOK_SECRET) {
            // If no secret, check for admin auth (optional, but safer to just require secret for this specific query)
            const identity = await ctx.auth.getUserIdentity();
            if (!identity) {
                // Fail silently or throw? Throwing is better for security.
                throw new Error("Unauthorized");
            }
            // If logged in, check if admin? Or if it's the user themselves?
            // For now, let's strictly require the secret or Admin.
            const user = await ctx.db
                .query("users")
                .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
                .first();
            if (!user?.isAdmin) {
                throw new Error("Unauthorized");
            }
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
        stripeCustomerId: v.optional(v.string()), // Optional for manual/role-based sync
        subscriptionStatus: v.string(),
        subscriptionName: v.optional(v.string()),
        roleId: v.optional(v.string()),
        secret: v.string(), // Added secret
    },
    handler: async (ctx, args) => {
        if (args.secret !== process.env.CLERK_WEBHOOK_SECRET) {
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
        secret: v.string(), // Added secret
    },
    handler: async (ctx, args) => {
        if (args.secret !== process.env.CLERK_WEBHOOK_SECRET) {
            throw new Error("Unauthorized: Invalid secret");
        }

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

// 4. ユーザー情報を保存・更新（Entryアプリ用：Discord IDを含む）
// ※既存のsyncUserとは別に、Entryアプリ専用の関数として追加します
export const storeUser = mutation({
    args: {
        clerkId: v.string(),
        email: v.string(),
        name: v.string(),
        imageUrl: v.optional(v.string()),
        discordId: v.optional(v.string()),
        secret: v.string(), // Added secret
    },
    handler: async (ctx, args) => {
        if (args.secret !== process.env.CLERK_WEBHOOK_SECRET) {
            throw new Error("Unauthorized: Invalid secret");
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
                discordId: args.discordId, // Update Discord ID
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
            console.log(`[storeUser] Found existing user by email ${args.email}. Linking to Clerk ID ${args.clerkId}`);
            await ctx.db.patch(existingByEmail._id, {
                clerkId: args.clerkId, // Link Clerk ID
                name: args.name,
                imageUrl: args.imageUrl,
                discordId: args.discordId,
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
            discordId: args.discordId,
            discordRoles: [],
            isAdmin: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
        return userId;
    },
});

export const getUserByClerkIdQuery = query({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
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
    args: {
        discordId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
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
            // Update Discord ID if provided and different
            if (args.discordId && user.discordId !== args.discordId) {
                await ctx.db.patch(user._id, {
                    discordId: args.discordId,
                    updatedAt: Date.now(),
                });
            }
            return user._id;
        }

        // Check by email to avoid duplicates if migration happened
        if (email) {
            const existingByEmail = await ctx.db
                .query("users")
                .withIndex("by_email", (q) => q.eq("email", email))
                .first();
            if (existingByEmail) {
                await ctx.db.patch(existingByEmail._id, {
                    clerkId: clerkId,
                    name: name,
                    imageUrl: imageUrl,
                    discordId: args.discordId || existingByEmail.discordId, // Update Discord ID if provided
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
            discordId: args.discordId,
            discordRoles: [],
            isAdmin: false, // Default to false
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return newUserId;
    },
});

export const checkUserByEmail = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("email"), args.email))
            .first();
        return !!user;
    },
});