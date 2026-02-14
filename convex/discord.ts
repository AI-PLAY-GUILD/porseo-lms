"use node";

import { action } from "./_generated/server";
import { internal } from "./_generated/api";

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
