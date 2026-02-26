import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { convex } from "@/lib/convex";
import { api } from "../../../../convex/_generated/api";

const discordToken = process.env.DISCORD_BOT_TOKEN;
const guildId = process.env.DISCORD_GUILD_ID;
const roleId = process.env.DISCORD_ROLE_ID;

// Issue #62: In-memory Discord role cache to reduce API calls
const roleCache = new Map<string, { roles: string[]; cachedAt: number }>();
const ROLE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedRoles(discordId: string): string[] | null {
    const entry = roleCache.get(discordId);
    if (!entry) return null;
    if (Date.now() - entry.cachedAt > ROLE_CACHE_TTL) {
        roleCache.delete(discordId);
        return null;
    }
    return entry.roles;
}

function setCachedRoles(discordId: string, roles: string[]) {
    // Lazy cleanup when cache grows too large
    if (roleCache.size > 5000) {
        const now = Date.now();
        for (const [key, val] of roleCache) {
            if (now - val.cachedAt > ROLE_CACHE_TTL) roleCache.delete(key);
        }
    }
    roleCache.set(discordId, { roles, cachedAt: Date.now() });
}

export async function POST(_req: Request) {
    console.log("[check-subscription] リクエスト受信", { method: "POST" });
    try {
        const { userId } = await auth();
        if (!userId) {
            console.log("[check-subscription] 認証失敗: userId が存在しません");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Get user from Convex
        const user = await convex.query(api.users.getUserByClerkIdServer, {
            clerkId: userId,
            secret: process.env.CONVEX_INTERNAL_SECRET || "",
        });

        if (!user) {
            console.log("[check-subscription] ユーザーが見つかりません", { clerkId: userId });
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // If already active, return success
        if (user.subscriptionStatus === "active") {
            console.log("[check-subscription] 成功: サブスクリプションは既にアクティブ", { userId });
            return NextResponse.json({ status: "active" });
        }

        if (!user.discordId) {
            console.log("[check-subscription] Discord ID が未連携", { userId });
            return NextResponse.json({ error: "Discord ID not linked" }, { status: 400 });
        }

        // 2. Check Discord Roles
        if (!discordToken || !guildId || !roleId) {
            console.error("Missing Discord env vars");
            return NextResponse.json({ error: "Configuration error" }, { status: 500 });
        }

        // Issue #62: Check cache first before calling Discord API
        let roles: string[];
        const cachedRoles = getCachedRoles(user.discordId);

        if (cachedRoles) {
            console.log("[check-subscription] キャッシュからロール取得", { discordId: user.discordId });
            roles = cachedRoles;
        } else {
            console.log("[check-subscription] Discord APIからロール取得", { discordId: user.discordId });
            // Issue #56: Add timeout to Discord API call
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            let discordRes: Response;
            try {
                discordRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${user.discordId}`, {
                    headers: {
                        Authorization: `Bot ${discordToken}`,
                    },
                    signal: controller.signal,
                });
            } finally {
                clearTimeout(timeoutId);
            }

            if (!discordRes.ok) {
                const errorText = await discordRes.text();
                console.error("Discord API Error:", errorText);
                if (discordRes.status === 404) {
                    return NextResponse.json({ error: "User not in Discord server" }, { status: 404 });
                }
                // Issue #57: Sanitize error response — don't expose Discord status code
                return NextResponse.json({ error: "Failed to fetch Discord member" }, { status: 502 });
            }

            const member = await discordRes.json();
            roles = member.roles || [];
            setCachedRoles(user.discordId, roles);
        }

        if (roles.includes(roleId)) {
            // 3. Update Subscription Status
            await convex.mutation(api.users.updateSubscriptionStatus, {
                discordId: user.discordId,
                subscriptionStatus: "active",
                roleId: roleId,
                secret: process.env.CONVEX_INTERNAL_SECRET || "",
            });
            console.log("[check-subscription] 成功: サブスクリプションをアクティブに更新", { discordId: user.discordId });
            return NextResponse.json({ status: "active", updated: true });
        } else {
            console.log("[check-subscription] 成功: サブスクリプションは非アクティブ", { discordId: user.discordId });
            return NextResponse.json({ status: "inactive" });
        }
    } catch (error: unknown) {
        // Issue #56: Handle timeout errors
        if (error instanceof DOMException && error.name === "AbortError") {
            console.error("[check-subscription] エラー: Discord APIタイムアウト");
            return NextResponse.json({ error: "External service timeout" }, { status: 504 });
        }
        console.error("[check-subscription] エラー:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
