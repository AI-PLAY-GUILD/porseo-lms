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

                            // Get Discord user ID and save to DB (Issue #16 fix: set server-side)
                            if (!user.discordId) {
                                const meController = new AbortController();
                                const meTimeout = setTimeout(() => meController.abort(), 10000);
                                try {
                                    const meResponse = await fetch("https://discord.com/api/users/@me", {
                                        headers: { Authorization: `Bearer ${accessToken}` },
                                        signal: meController.signal,
                                    });
                                    if (meResponse.ok) {
                                        const meData = await meResponse.json();
                                        if (meData.id) {
                                            await ctx.runMutation(internal.internal.setDiscordId, {
                                                userId: user._id,
                                                discordId: meData.id,
                                            });
                                            console.log("[stripe:createCustomer] Discord ID保存成功", {
                                                discordId: meData.id,
                                            });
                                        }
                                    }
                                } finally {
                                    clearTimeout(meTimeout);
                                }
                            }

                            // Get Discord guild roles
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

