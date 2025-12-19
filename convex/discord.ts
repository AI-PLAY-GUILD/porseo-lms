"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

export const getDiscordRoles = action({
    args: {},
    handler: async (ctx) => {
        console.log("[Discord API] Starting getDiscordRoles...");
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
            // トークンがない場合などは空配列を返す（連携していないとみなす）
            return [];
        }

        const clerkData = await clerkResponse.json();
        if (!clerkData.length || !clerkData[0].token) {
            return [];
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

        // Rate Limit Logging
        const limit = discordResponse.headers.get("x-ratelimit-limit");
        const remaining = discordResponse.headers.get("x-ratelimit-remaining");
        const reset = discordResponse.headers.get("x-ratelimit-reset");
        console.log(`[Discord API] Rate Limit: ${remaining}/${limit} (Reset: ${reset})`);

        if (!discordResponse.ok) {
            if (discordResponse.status === 404) {
                return [];
            }
            console.error("Discord API Error:", await discordResponse.text());
            return [];
        }

        const discordData = await discordResponse.json();
        return discordData.roles as string[];
    },
});
