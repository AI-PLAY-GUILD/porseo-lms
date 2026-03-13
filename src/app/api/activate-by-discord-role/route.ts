import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { convex } from "@/lib/convex";
import { getConvexInternalSecret } from "@/lib/env";
import { api } from "../../../../convex/_generated/api";

const discordToken = process.env.DISCORD_BOT_TOKEN;
const guildId = process.env.DISCORD_GUILD_ID;
const roleId = process.env.DISCORD_ROLE_ID;

/**
 * POST /api/activate-by-discord-role
 *
 * 既存コミュニティメンバーの初回アクティベーション用エンドポイント。
 * 1. ClerkからDiscord IDを取得
 * 2. ConvexにユーザーをUpsert（初回登録）
 * 3. Discord IDをConvexに保存
 * 4. ボットトークンでDiscordサーバーのロールを確認
 * 5. 対象ロールがあれば subscriptionStatus を "active" に更新
 */
export async function POST(_req: Request) {
    console.log("[activate-by-discord-role] リクエスト受信");
    try {
        // 1. Clerk認証
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. ClerkからDiscord情報を取得
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);
        const discordAccount = clerkUser.externalAccounts.find(
            (acc) => acc.provider === "oauth_discord" || acc.provider === "discord",
        );

        if (!discordAccount || !discordAccount.externalId) {
            console.log("[activate-by-discord-role] Discordアカウント未連携", { userId });
            return NextResponse.json({ error: "Discord account not linked" }, { status: 400 });
        }

        const discordUserId = discordAccount.externalId;
        const discordUsername = discordAccount.username || discordAccount.firstName || "Unknown";
        const email = clerkUser.emailAddresses[0]?.emailAddress || `${discordUserId}@discord.invalid`;
        const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || discordUsername;

        console.log("[activate-by-discord-role] Discord ID取得完了", { discordUserId });

        // 3. ConvexにユーザーをUpsert（初回は新規作成）
        try {
            await convex.mutation(api.users.webhookSyncUser, {
                clerkId: userId,
                email,
                name,
                imageUrl: clerkUser.imageUrl,
                secret: getConvexInternalSecret(),
            });
            console.log("[activate-by-discord-role] Convexユーザー作成/更新完了");
        } catch (e) {
            console.error("[activate-by-discord-role] Convexユーザー同期失敗:", e);
            return NextResponse.json({ error: "Failed to sync user" }, { status: 500 });
        }

        // 4. Discord IDをConvexに保存
        try {
            await convex.mutation(api.users.setDiscordIdByClerkId, {
                clerkId: userId,
                discordId: discordUserId,
                secret: getConvexInternalSecret(),
            });
            console.log("[activate-by-discord-role] Discord ID保存完了");
        } catch (e) {
            console.error("[activate-by-discord-role] Discord ID保存失敗:", e);
            return NextResponse.json({ error: "Failed to save Discord ID" }, { status: 500 });
        }

        // 5. 環境変数チェック
        if (!discordToken || !guildId || !roleId) {
            console.error("[activate-by-discord-role] Discord環境変数が未設定");
            return NextResponse.json({ error: "Configuration error" }, { status: 500 });
        }

        // 6. BotトークンでDiscordサーバーのロールを確認
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        let discordRes: Response;
        try {
            discordRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}`, {
                headers: { Authorization: `Bot ${discordToken}` },
                signal: controller.signal,
            });
        } finally {
            clearTimeout(timeoutId);
        }

        if (!discordRes.ok) {
            if (discordRes.status === 404) {
                console.log("[activate-by-discord-role] Discordサーバー未参加", { discordUserId });
                return NextResponse.json({ status: "not_in_server", error: "対象のDiscordサーバーに参加していません" });
            }
            console.error("[activate-by-discord-role] Discord API Error:", discordRes.status);
            return NextResponse.json({ error: "Failed to fetch Discord member" }, { status: 502 });
        }

        const member = await discordRes.json();
        const roles: string[] = member.roles || [];
        console.log("[activate-by-discord-role] Discordロール取得完了", { roleCount: roles.length });

        if (!roles.includes(roleId)) {
            console.log("[activate-by-discord-role] 対象ロールなし", { discordUserId });
            return NextResponse.json({ status: "no_role", error: "対象のDiscordロールが付与されていません" });
        }

        // 7. サブスクリプションをアクティブに更新
        await convex.mutation(api.users.updateSubscriptionStatus, {
            discordId: discordUserId,
            subscriptionStatus: "active",
            roleId: roleId,
            secret: getConvexInternalSecret(),
        });

        console.log("[activate-by-discord-role] アクティベーション完了", { discordUserId });
        return NextResponse.json({ status: "active" });
    } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") {
            console.error("[activate-by-discord-role] Discord APIタイムアウト");
            return NextResponse.json({ error: "External service timeout" }, { status: 504 });
        }
        console.error("[activate-by-discord-role] エラー:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
