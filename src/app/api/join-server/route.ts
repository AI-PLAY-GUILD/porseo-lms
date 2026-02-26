import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(_req: Request) {
    console.log("[join-server] リクエスト受信", { method: "POST" });
    try {
        const { userId } = await auth();
        if (!userId) {
            console.log("[join-server] 認証失敗: userId が存在しません");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const client = await clerkClient();

        // 1. Get User to find Discord ID
        const user = await client.users.getUser(userId);
        const discordAccount = user.externalAccounts.find(
            (acc) => acc.provider === "oauth_discord" || acc.provider === "discord",
        );

        if (!discordAccount || !discordAccount.externalId) {
            console.log("[join-server] Discordアカウント未連携", { userId });
            return NextResponse.json({ error: "Discord account not linked" }, { status: 400 });
        }

        const discordUserId = discordAccount.externalId;

        // 2. Get Discord Access Token
        const response = await client.users.getUserOauthAccessToken(userId, "oauth_discord");

        if (!response.data || response.data.length === 0) {
            console.log("[join-server] Discordアクセストークンが見つかりません", { userId });
            return NextResponse.json({ error: "No Discord access token found" }, { status: 400 });
        }

        const accessToken = response.data[0].token;

        // 3. Add to Discord Server
        const guildId = process.env.DISCORD_GUILD_ID;
        const botToken = process.env.DISCORD_BOT_TOKEN;

        if (!guildId || !botToken) {
            console.error("Missing Discord env vars");
            return NextResponse.json({ error: "Configuration error" }, { status: 500 });
        }

        // Discord API: PUT /guilds/{guild.id}/members/{user.id}
        // Issue #56: Add timeout to Discord API call
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        let discordRes: Response;
        try {
            discordRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bot ${botToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    access_token: accessToken,
                }),
                signal: controller.signal,
            });
        } finally {
            clearTimeout(timeoutId);
        }

        if (discordRes.ok || discordRes.status === 201 || discordRes.status === 204) {
            console.log("[join-server] 成功: Discordサーバー参加完了", { discordUserId });
            return NextResponse.json({ success: true });
        } else {
            const errorText = await discordRes.text();
            console.error("Discord API Error:", errorText);
            // Issue #57: Sanitize error response — don't expose Discord error details to client
            return NextResponse.json({ error: "Failed to join Discord server" }, { status: 502 });
        }
    } catch (error: unknown) {
        // Issue #56: Handle timeout errors
        if (error instanceof DOMException && error.name === "AbortError") {
            console.error("[join-server] エラー: Discord APIタイムアウト");
            return NextResponse.json({ error: "External service timeout" }, { status: 504 });
        }
        console.error("[join-server] エラー:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
