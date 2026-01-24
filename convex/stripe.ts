"use node";

import { action, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal, api } from "./_generated/api";
import Stripe from "stripe";

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
            console.log("[Stripe+Discord] Starting Discord sync...");
            const clerkSecretKey = process.env.CLERK_SECRET_KEY;
            const guildId = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID;

            if (clerkSecretKey && guildId) {
                const clerkResponse = await fetch(
                    `https://api.clerk.com/v1/users/${identity.subject}/oauth_access_tokens/oauth_discord`,
                    {
                        headers: { Authorization: `Bearer ${clerkSecretKey}` },
                    }
                );

                if (clerkResponse.ok) {
                    const clerkData = await clerkResponse.json();
                    if (clerkData.length > 0 && clerkData[0].token) {
                        const accessToken = clerkData[0].token;
                        const discordResponse = await fetch(
                            `https://discord.com/api/users/@me/guilds/${guildId}/member`,
                            {
                                headers: { Authorization: `Bearer ${accessToken}` },
                            }
                        );

                        if (discordResponse.ok) {
                            const discordData = await discordResponse.json();
                            discordRoles = discordData.roles as string[];
                            console.log(`[Stripe+Discord] Fetched ${discordRoles.length} roles`);

                            // Sync roles internally
                            await ctx.runMutation(internal.discord.updateDiscordRoles, {
                                clerkId: identity.subject,
                                discordRoles: discordRoles,
                            });
                        } else {
                            console.error("[Stripe+Discord] Discord API failed:", await discordResponse.text());
                        }
                    } else {
                        console.log("[Stripe+Discord] No Discord token found");
                    }
                } else {
                    console.error("[Stripe+Discord] Clerk API failed:", await clerkResponse.text());
                }
            } else {
                console.error("[Stripe+Discord] Missing env variables");
            }
        } catch (e) {
            console.error("[Stripe+Discord] Error fetching roles:", e);
            // Don't fail the whole action if Discord fails, just log it
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
                console.log(`Found existing Stripe customer for ${user.email}: ${customerId}`);
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
                console.log(`Created new Stripe customer for ${user.email}: ${customerId}`);
            }

            await ctx.runMutation(internal.internal.setStripeCustomerId, {
                userId: user._id,
                stripeCustomerId: customerId,
            });
        }

        return { customerId };
    },
});

export const linkStripeCustomerByEmail = action({
    args: { email: v.string() },
    handler: async (ctx, args) => {
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

        if (args.email !== user.email) {
            throw new Error("Cannot link an email different from your account email.");
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: "2025-12-15.clover",
        });

        const customers = await stripe.customers.list({
            email: args.email,
            limit: 1,
        });

        if (customers.data.length === 0) {
            return { success: false, message: "入力されたメールアドレスのStripe顧客が見つかりませんでした。" };
        }

        const customerId = customers.data[0].id;

        // Fetch active subscriptions to sync status
        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'active',
            limit: 1,
        });

        let subscriptionStatus = 'inactive';
        if (subscriptions.data.length > 0) {
            subscriptionStatus = 'active';
        }

        await ctx.runMutation(internal.internal.updateUserStripeInfo, {
            userId: user._id,
            stripeCustomerId: customerId,
            subscriptionStatus: subscriptionStatus,
        });

        return { success: true, message: "Stripeアカウントの連携が完了しました。" };
    },
});

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
    },
    handler: async (ctx, args) => {
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
    },
    handler: async (ctx, args) => {
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
