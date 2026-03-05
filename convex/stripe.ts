"use node";

import { v } from "convex/values";
import Stripe from "stripe";
import { api, internal } from "./_generated/api";
import { action } from "./_generated/server";

export const createCustomer = action({
    args: {},
    handler: async (ctx): Promise<{ customerId: string }> => {
        console.log("[stripe:createCustomer] 開始");
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            console.log("[stripe:createCustomer] 未認証ユーザー");
            throw new Error("Unauthenticated");
        }

        const user = await ctx.runQuery(api.users.getUserByClerkIdQuery, {
            clerkId: identity.subject,
        });

        if (!user) {
            console.log("[stripe:createCustomer] ユーザー未検出", { clerkId: identity.subject });
            throw new Error("User not found");
        }

        // --- Discord Logic Start ---
        let discordRoles: string[] = [];
        try {
            const clerkSecretKey = process.env.CLERK_SECRET_KEY;
            const guildId = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID;

            if (clerkSecretKey && guildId) {
                // Issue #56: Add timeout to external API calls
                const clerkController = new AbortController();
                const clerkTimeout = setTimeout(() => clerkController.abort(), 10000);
                try {
                    const clerkResponse = await fetch(
                        `https://api.clerk.com/v1/users/${identity.subject}/oauth_access_tokens/oauth_discord`,
                        {
                            headers: { Authorization: `Bearer ${clerkSecretKey}` },
                            signal: clerkController.signal,
                        },
                    );

                    if (clerkResponse.ok) {
                        const clerkData = await clerkResponse.json();
                        if (clerkData.length > 0 && clerkData[0].token) {
                            const accessToken = clerkData[0].token;
                            const discordController = new AbortController();
                            const discordTimeout = setTimeout(() => discordController.abort(), 10000);
                            try {
                                const discordResponse = await fetch(
                                    `https://discord.com/api/users/@me/guilds/${guildId}/member`,
                                    {
                                        headers: { Authorization: `Bearer ${accessToken}` },
                                        signal: discordController.signal,
                                    },
                                );

                                if (discordResponse.ok) {
                                    const discordData = await discordResponse.json();
                                    discordRoles = discordData.roles as string[];
                                }
                            } finally {
                                clearTimeout(discordTimeout);
                            }
                        }
                    }
                } finally {
                    clearTimeout(clerkTimeout);
                }
            }
        } catch (e) {
            console.error("[stripe:createCustomer] Discordロール取得エラー:", e);
        }

        // Security fix (Issue #8): Save roles server-side directly, don't return to client
        if (discordRoles.length > 0) {
            await ctx.runMutation(internal.users.updateDiscordRoles, {
                clerkId: identity.subject,
                discordRoles: discordRoles,
            });
        }
        // --- Discord Logic End ---

        let customerId: string;
        if (user.stripeCustomerId) {
            console.log("[stripe:createCustomer] 既存のStripe顧客ID使用", { stripeCustomerId: user.stripeCustomerId });
            customerId = user.stripeCustomerId;
        } else {
            console.log("[stripe:createCustomer] Stripe顧客検索/作成開始");
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
                apiVersion: "2025-12-15.clover",
            });

            // 1. Search for existing customer by email
            const existingCustomers = await stripe.customers.list({
                email: user.email,
                limit: 1,
            });

            if (existingCustomers.data.length > 0) {
                // Found existing customer
                console.log("[stripe:createCustomer] 既存Stripe顧客をメールで発見", {
                    customerId: existingCustomers.data[0].id,
                });
                customerId = existingCustomers.data[0].id;
            } else {
                console.log("[stripe:createCustomer] 新規Stripe顧客作成");
                // Create new customer
                const customer = await stripe.customers.create({
                    email: user.email,
                    name: user.name,
                    metadata: {
                        clerkId: user.clerkId,
                        userId: user._id,
                    },
                });
                customerId = customer.id;
            }

            await ctx.runMutation(internal.internal.setStripeCustomerId, {
                userId: user._id,
                stripeCustomerId: customerId,
            });
        }

        console.log("[stripe:createCustomer] 完了", { customerId });
        return { customerId };
    },
});

// Re-implemented with security: requires auth + email verification
// When email doesn't match logged-in user, requires additional name verification
export const linkStripeCustomerByEmail = action({
    args: { email: v.string(), customerName: v.optional(v.string()) },
    handler: async (
        ctx,
        args,
    ): Promise<{
        success: boolean;
        message: string;
        needsVerification?: boolean;
        hasActiveSubscription?: boolean;
        needsSubscription?: boolean;
    }> => {
        console.log("[stripe:linkStripeCustomerByEmail] 開始", { email: args.email });
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            console.log("[stripe:linkStripeCustomerByEmail] 未認証ユーザー");
            throw new Error("Unauthenticated");
        }

        const user = await ctx.runQuery(api.users.getUserByClerkIdQuery, {
            clerkId: identity.subject,
        });
        if (!user) {
            console.log("[stripe:linkStripeCustomerByEmail] ユーザー未検出", { clerkId: identity.subject });
            throw new Error("User not found");
        }

        // Already linked
        if (user.stripeCustomerId) {
            console.log("[stripe:linkStripeCustomerByEmail] 完了 (既にリンク済み)", {
                stripeCustomerId: user.stripeCustomerId,
            });
            return { success: true, message: "既にStripeアカウントと連携済みです" };
        }

        const inputEmail = args.email.trim().toLowerCase();
        const userEmail = (user.email || "").trim().toLowerCase();
        const emailMatches = inputEmail === userEmail;

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: "2025-12-15.clover",
        });

        // Search Stripe for existing customer
        const existingCustomers = await stripe.customers.list({
            email: inputEmail,
            limit: 1,
        });

        if (existingCustomers.data.length === 0) {
            console.log("[stripe:linkStripeCustomerByEmail] 完了 (Stripe顧客未検出)");
            return {
                success: false,
                message: "このメールアドレスに紐づくStripe顧客が見つかりませんでした",
            };
        }

        const stripeCustomer = existingCustomers.data[0];
        const customerId = stripeCustomer.id;
        console.log("[stripe:linkStripeCustomerByEmail] Stripe顧客発見", { customerId });

        // If email doesn't match, require name verification
        if (!emailMatches) {
            if (!args.customerName) {
                console.log("[stripe:linkStripeCustomerByEmail] メール不一致 → 名前確認要求");
                return {
                    success: false,
                    needsVerification: true,
                    message:
                        "ログイン中のメールアドレスと異なるため、本人確認が必要です。Stripeに登録されているお名前を入力してください。",
                };
            }

            // Verify name matches the Stripe customer
            const stripeName = (stripeCustomer.name || "").trim().toLowerCase().replace(/\s+/g, "");
            const inputName = args.customerName.trim().toLowerCase().replace(/\s+/g, "");

            if (!stripeName || stripeName !== inputName) {
                console.log("[stripe:linkStripeCustomerByEmail] 名前不一致", { stripeName, inputName });
                return {
                    success: false,
                    needsVerification: true,
                    message: "お名前が一致しません。Stripeに登録されているお名前を正確に入力してください。",
                };
            }

            console.log("[stripe:linkStripeCustomerByEmail] 名前確認OK");
        }

        // Check for active subscription
        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: "active",
            limit: 1,
        });

        const hasActiveSubscription = subscriptions.data.length > 0;

        if (hasActiveSubscription) {
            // Has active subscription → set active immediately
            const sub = subscriptions.data[0];
            const subscriptionName =
                sub.items.data[0]?.price?.nickname || sub.items.data[0]?.plan?.nickname || "Premium Membership";

            await ctx.runMutation(internal.internal.setStripeCustomerWithSubscription, {
                userId: user._id,
                stripeCustomerId: customerId,
                subscriptionStatus: "active",
                subscriptionName: subscriptionName,
            });

            // Assign Discord role
            try {
                const discordBotToken = process.env.DISCORD_BOT_TOKEN;
                const discordGuildId = process.env.DISCORD_GUILD_ID;
                const discordRoleId = process.env.DISCORD_ROLE_ID;

                if (discordBotToken && discordGuildId && discordRoleId && user.discordId) {
                    const { REST } = await import("@discordjs/rest");
                    const { Routes } = await import("discord-api-types/v10");
                    const rest = new REST({ version: "10", timeout: 10_000 }).setToken(discordBotToken);
                    await rest.put(Routes.guildMemberRole(discordGuildId, user.discordId, discordRoleId));
                    console.log("[stripe:linkStripeCustomerByEmail] Discordロール付与成功", {
                        discordId: user.discordId,
                    });
                }
            } catch (discordError) {
                console.error("[stripe:linkStripeCustomerByEmail] Discordロール付与失敗:", discordError);
            }

            console.log("[stripe:linkStripeCustomerByEmail] 完了 (アクティブなサブスクリプションあり)", { customerId });
            return {
                success: true,
                hasActiveSubscription: true,
                message: "Stripeアカウントと連携し、アクティブなサブスクリプションを確認しました！",
            };
        }

        // No subscription (legacy one-time payment user) → link customer ID only, don't set active
        await ctx.runMutation(internal.internal.setStripeCustomerId, {
            userId: user._id,
            stripeCustomerId: customerId,
        });

        // Cancel Wix recurring plan for this user
        try {
            await cancelWixOrders(inputEmail);
        } catch (wixError) {
            console.error("[stripe:linkStripeCustomerByEmail] Wixキャンセル失敗:", wixError);
        }

        console.log("[stripe:linkStripeCustomerByEmail] 完了 (サブスクなし → サブスク購入へ誘導)", { customerId });
        return {
            success: true,
            hasActiveSubscription: false,
            needsSubscription: true,
            message: "Stripeアカウントと連携しました！サービスを継続するにはサブスクリプションの登録が必要です。",
        };
    },
});

/**
 * Cancel active Wix pricing plan orders for a user by email.
 * Uses Wix REST API to find and cancel recurring orders.
 */
async function cancelWixOrders(email: string) {
    const wixApiKey = process.env.WIX_API_KEY;
    const wixSiteId = process.env.WIX_SITE_ID;

    if (!wixApiKey || !wixSiteId) {
        console.log("[cancelWixOrders] WIX_API_KEY or WIX_SITE_ID not set, skipping");
        return;
    }

    const headers = {
        Authorization: wixApiKey,
        "wix-site-id": wixSiteId,
        "Content-Type": "application/json",
    };

    // 1. Find Wix member by email via Contacts API
    const contactsRes = await fetch("https://www.wixapis.com/contacts/v4/contacts/query", {
        method: "POST",
        headers,
        body: JSON.stringify({
            query: {
                filter: JSON.stringify({
                    "info.emails.email": { $eq: email },
                }),
            },
        }),
    });

    if (!contactsRes.ok) {
        const errorText = await contactsRes.text();
        console.error("[cancelWixOrders] Wix Contacts検索失敗:", contactsRes.status, errorText);
        return;
    }

    const contactsData = await contactsRes.json();
    const contacts = contactsData.contacts || [];

    if (contacts.length === 0) {
        console.log("[cancelWixOrders] Wixコンタクト未検出", { email });
        return;
    }

    const memberId = contacts[0].source?.memberId || contacts[0].id;
    console.log("[cancelWixOrders] Wixメンバー発見", { email, memberId });

    // 2. List pricing plan orders for this member
    const ordersRes = await fetch("https://www.wixapis.com/pricing-plans/v2/orders/query", {
        method: "POST",
        headers,
        body: JSON.stringify({
            query: {
                filter: JSON.stringify({
                    "buyer.memberId": memberId,
                    status: "ACTIVE",
                }),
            },
        }),
    });

    if (!ordersRes.ok) {
        const errorText = await ordersRes.text();
        console.error("[cancelWixOrders] Wix注文一覧取得失敗:", ordersRes.status, errorText);
        return;
    }

    const ordersData = await ordersRes.json();
    const orders = ordersData.orders || [];

    if (orders.length === 0) {
        console.log("[cancelWixOrders] アクティブな注文なし", { email });
        return;
    }

    // 3. Cancel each active order
    for (const order of orders) {
        const cancelRes = await fetch(`https://www.wixapis.com/pricing-plans/v2/orders/${order._id}/cancel`, {
            method: "POST",
            headers,
            body: JSON.stringify({ effectiveAt: "IMMEDIATELY" }),
        });

        if (cancelRes.ok) {
            console.log("[cancelWixOrders] Wix注文キャンセル成功", { orderId: order._id, email });
        } else {
            const errorText = await cancelRes.text();
            console.error("[cancelWixOrders] Wix注文キャンセル失敗:", {
                orderId: order._id,
                status: cancelRes.status,
                error: errorText,
            });
        }
    }
}

// Security fix: Save Discord roles server-side only, return sync status (not raw role IDs)
export const getDiscordRolesV2 = action({
    args: {},
    handler: async (ctx): Promise<{ synced: boolean }> => {
        console.log("[stripe:getDiscordRolesV2] 開始");
        try {
            const identity = await ctx.auth.getUserIdentity();
            if (!identity) {
                console.log("[stripe:getDiscordRolesV2] 未認証ユーザー");
                throw new Error("Unauthenticated");
            }

            const clerkSecretKey = process.env.CLERK_SECRET_KEY;
            if (!clerkSecretKey) {
                console.error("[stripe:getDiscordRolesV2] CLERK_SECRET_KEY未設定");
                throw new Error("Missing CLERK_SECRET_KEY env variable");
            }

            const guildId = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID;
            if (!guildId) {
                console.error("[stripe:getDiscordRolesV2] NEXT_PUBLIC_DISCORD_GUILD_ID未設定");
                throw new Error("Missing NEXT_PUBLIC_DISCORD_GUILD_ID env variable");
            }

            console.log("[stripe:getDiscordRolesV2] Clerk APIからDiscordトークン取得開始");
            // 1. Clerk API: Get Discord Access Token
            // Issue #56: Add timeout to external API calls
            const clerkController = new AbortController();
            const clerkTimeout = setTimeout(() => clerkController.abort(), 10000);
            let clerkResponse: Response;
            try {
                clerkResponse = await fetch(
                    `https://api.clerk.com/v1/users/${identity.subject}/oauth_access_tokens/oauth_discord`,
                    {
                        headers: {
                            Authorization: `Bearer ${clerkSecretKey}`,
                        },
                        signal: clerkController.signal,
                    },
                );
            } finally {
                clearTimeout(clerkTimeout);
            }

            if (!clerkResponse.ok) {
                console.error("[stripe:getDiscordRolesV2] Clerk APIエラー:", await clerkResponse.text());
                return { synced: false };
            }

            const clerkData = await clerkResponse.json();
            if (!clerkData.length || !clerkData[0].token) {
                console.log("[stripe:getDiscordRolesV2] Discordトークン未取得");
                return { synced: false };
            }

            const accessToken = clerkData[0].token;

            console.log("[stripe:getDiscordRolesV2] Discord APIからロール取得開始");
            // 2. Discord API: Get Current User Guild Member
            const discordController = new AbortController();
            const discordTimeout = setTimeout(() => discordController.abort(), 10000);
            let discordResponse: Response;
            try {
                discordResponse = await fetch(`https://discord.com/api/users/@me/guilds/${guildId}/member`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                    signal: discordController.signal,
                });
            } finally {
                clearTimeout(discordTimeout);
            }

            if (!discordResponse.ok) {
                if (discordResponse.status === 404) {
                    console.log("[stripe:getDiscordRolesV2] ギルドメンバー未検出 (404)");
                    return { synced: false };
                }
                console.error("[stripe:getDiscordRolesV2] Discord APIエラー:", await discordResponse.text());
                return { synced: false };
            }

            const discordData = await discordResponse.json();
            const roles = discordData.roles as string[];

            console.log("[stripe:getDiscordRolesV2] ロール保存開始", { rolesCount: roles.length });
            // Save roles server-side — never expose raw role IDs to client
            await ctx.runMutation(internal.users.updateDiscordRoles, {
                clerkId: identity.subject,
                discordRoles: roles,
            });

            console.log("[stripe:getDiscordRolesV2] 完了", { synced: true, rolesCount: roles.length });
            return { synced: true };
        } catch (error) {
            console.error("[stripe:getDiscordRolesV2] エラー:", error);
            throw error;
        }
    },
});
