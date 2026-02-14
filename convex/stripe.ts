"use node";

import { action } from "./_generated/server";
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
                        }
                    }
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

// linkStripeCustomerByEmail has been removed due to security risks (CWE-285). 
// See security_diagnosis_report.md for details.

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
            const clerkResponse = await fetch(
                `https://api.clerk.com/v1/users/${identity.subject}/oauth_access_tokens/oauth_discord`,
                {
                    headers: {
                        Authorization: `Bearer ${clerkSecretKey}`,
                    },
                }
            );

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
            const discordResponse = await fetch(
                `https://discord.com/api/users/@me/guilds/${guildId}/member`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

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
