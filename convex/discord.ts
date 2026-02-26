"use node";

import { internal } from "./_generated/api";
import { action } from "./_generated/server";

// Security fix: Save Discord roles server-side only, return sync status (not raw role IDs)
export const getDiscordRolesV2 = action({
    args: {},
    handler: async (ctx): Promise<{ synced: boolean }> => {
        console.log("[discord:getDiscordRolesV2] 開始");
        try {
            const identity = await ctx.auth.getUserIdentity();
            if (!identity) {
                console.log("[discord:getDiscordRolesV2] 未認証ユーザー");
                throw new Error("Unauthenticated");
            }

            const clerkSecretKey = process.env.CLERK_SECRET_KEY;
            if (!clerkSecretKey) {
                console.error("[discord:getDiscordRolesV2] CLERK_SECRET_KEY未設定");
                throw new Error("Missing CLERK_SECRET_KEY env variable");
            }

            const guildId = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID;
            if (!guildId) {
                console.error("[discord:getDiscordRolesV2] NEXT_PUBLIC_DISCORD_GUILD_ID未設定");
                throw new Error("Missing NEXT_PUBLIC_DISCORD_GUILD_ID env variable");
            }

            console.log("[discord:getDiscordRolesV2] Clerk APIからDiscordトークン取得開始");
            // 1. Clerk API: Get Discord Access Token
            const clerkResponse = await fetch(
                `https://api.clerk.com/v1/users/${identity.subject}/oauth_access_tokens/oauth_discord`,
                {
                    headers: {
                        Authorization: `Bearer ${clerkSecretKey}`,
                    },
                },
            );

            if (!clerkResponse.ok) {
                console.error("[discord:getDiscordRolesV2] Clerk APIエラー:", await clerkResponse.text());
                return { synced: false };
            }

            const clerkData = await clerkResponse.json();
            if (!clerkData.length || !clerkData[0].token) {
                console.log("[discord:getDiscordRolesV2] Discordトークン未取得");
                return { synced: false };
            }

            const accessToken = clerkData[0].token;

            console.log("[discord:getDiscordRolesV2] Discord APIからロール取得開始");
            // 2. Discord API: Get Current User Guild Member
            const discordResponse = await fetch(`https://discord.com/api/users/@me/guilds/${guildId}/member`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (!discordResponse.ok) {
                if (discordResponse.status === 404) {
                    console.log("[discord:getDiscordRolesV2] ギルドメンバー未検出 (404)");
                    return { synced: false };
                }
                console.error("[discord:getDiscordRolesV2] Discord APIエラー:", await discordResponse.text());
                return { synced: false };
            }

            const discordData = await discordResponse.json();
            const roles = discordData.roles as string[];

            console.log("[discord:getDiscordRolesV2] ロール保存開始", { rolesCount: roles.length });
            // Save roles server-side — never expose raw role IDs to client
            await ctx.runMutation(internal.users.updateDiscordRoles, {
                clerkId: identity.subject,
                discordRoles: roles,
            });

            console.log("[discord:getDiscordRolesV2] 完了", { synced: true, rolesCount: roles.length });
            return { synced: true };
        } catch (error) {
            console.error("[Discord API] Critical Error:", error);
            throw error;
        }
    },
});
