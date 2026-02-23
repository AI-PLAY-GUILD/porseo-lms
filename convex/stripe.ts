"use node";

import { action } from "./_generated/server";
import { internal, api } from "./_generated/api";
import Stripe from "stripe";
import { v } from "convex/values";

export const createCustomer = action({
    args: {},
    handler: async (ctx): Promise<{ customerId: string }> => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthenticated");
        }

        const user = await ctx.runQuery(api.users.getUserByClerkIdQuery, {
            clerkId: identity.subject,
        });

        if (!user) {
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
                        }
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
                                    }
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
            console.error("[Stripe+Discord] Error fetching roles:", e);
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
            customerId = user.stripeCustomerId;
        } else {
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
                customerId = existingCustomers.data[0].id;
            } else {
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

        return { customerId };
    },
});

// Re-implemented with security: requires auth + email must match the logged-in user's email
export const linkStripeCustomerByEmail = action({
    args: { email: v.string() },
    handler: async (ctx, args): Promise<{ success: boolean; message: string }> => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthenticated");
        }

        const user = await ctx.runQuery(api.users.getUserByClerkIdQuery, {
            clerkId: identity.subject,
        });
        if (!user) {
            throw new Error("User not found");
        }

        // Security: verify the email matches the authenticated user's email
        const inputEmail = args.email.trim().toLowerCase();
        const userEmail = (user.email || "").trim().toLowerCase();
        if (inputEmail !== userEmail) {
            throw new Error(
                "入力されたメールアドレスがアカウントのメールアドレスと一致しません"
            );
        }

        // Already linked
        if (user.stripeCustomerId) {
            return { success: true, message: "既にStripeアカウントと連携済みです" };
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: "2025-12-15.clover",
        });

        // Search Stripe for existing customer
        const existingCustomers = await stripe.customers.list({
            email: inputEmail,
            limit: 1,
        });

        if (existingCustomers.data.length === 0) {
            return {
                success: false,
                message: "このメールアドレスに紐づくStripe顧客が見つかりませんでした",
            };
        }

        const customerId = existingCustomers.data[0].id;

        // Check for active subscription
        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: "active",
            limit: 1,
        });

        await ctx.runMutation(internal.internal.setStripeCustomerId, {
            userId: user._id,
            stripeCustomerId: customerId,
        });

        if (subscriptions.data.length > 0) {
            return {
                success: true,
                message: "Stripeアカウントと連携し、アクティブなサブスクリプションを確認しました！",
            };
        }

        return {
            success: true,
            message: "Stripeアカウントと連携しました（アクティブなサブスクリプションはありません）",
        };
    },
});

// Security fix: Save Discord roles server-side only, return sync status (not raw role IDs)
export const getDiscordRolesV2 = action({
    args: {},
    handler: async (ctx): Promise<{ synced: boolean }> => {
        try {
            const identity = await ctx.auth.getUserIdentity();
            if (!identity) {
                throw new Error("Unauthenticated");
            }

            const clerkSecretKey = process.env.CLERK_SECRET_KEY;
            if (!clerkSecretKey) {
                throw new Error("Missing CLERK_SECRET_KEY env variable");
            }

            const guildId = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID;
            if (!guildId) {
                throw new Error("Missing NEXT_PUBLIC_DISCORD_GUILD_ID env variable");
            }

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
                    }
                );
            } finally {
                clearTimeout(clerkTimeout);
            }

            if (!clerkResponse.ok) {
                console.error("Clerk API Error:", await clerkResponse.text());
                return { synced: false };
            }

            const clerkData = await clerkResponse.json();
            if (!clerkData.length || !clerkData[0].token) {
                return { synced: false };
            }

            const accessToken = clerkData[0].token;

            // 2. Discord API: Get Current User Guild Member
            const discordController = new AbortController();
            const discordTimeout = setTimeout(() => discordController.abort(), 10000);
            let discordResponse: Response;
            try {
                discordResponse = await fetch(
                    `https://discord.com/api/users/@me/guilds/${guildId}/member`,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                        signal: discordController.signal,
                    }
                );
            } finally {
                clearTimeout(discordTimeout);
            }

            if (!discordResponse.ok) {
                if (discordResponse.status === 404) {
                    return { synced: false };
                }
                console.error("Discord API Error:", await discordResponse.text());
                return { synced: false };
            }

            const discordData = await discordResponse.json();
            const roles = discordData.roles as string[];

            // Save roles server-side — never expose raw role IDs to client
            await ctx.runMutation(internal.users.updateDiscordRoles, {
                clerkId: identity.subject,
                discordRoles: roles,
            });

            return { synced: true };
        } catch (error) {
            console.error("[Discord API] Critical Error:", error);
            throw error;
        }
    },
});
