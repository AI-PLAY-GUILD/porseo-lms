import { auth } from "@clerk/nextjs/server";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import { NextResponse } from "next/server";
import { convex } from "@/lib/convex";
import { api } from "../../../../convex/_generated/api";

const discordToken = process.env.DISCORD_BOT_TOKEN;
const guildId = process.env.DISCORD_GUILD_ID;
const roleId = process.env.DISCORD_ROLE_ID;

// Issue #56: Add timeout to Discord REST client
const rest = new REST({ version: "10", timeout: 10_000 }).setToken(discordToken || "");

export async function POST(_req: Request) {
    console.log("[sync-role] リクエスト受信", { method: "POST" });
    try {
        const { userId } = await auth();
        if (!userId) {
            console.log("[sync-role] 認証失敗: userId が存在しません");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Get user from Convex to check subscription and Discord ID
        const user = await convex.query(api.users.getUserByClerkIdServer, {
            clerkId: userId,
            secret: process.env.CONVEX_INTERNAL_SECRET || "",
        });

        if (!user) {
            console.log("[sync-role] ユーザーが見つかりません", { clerkId: userId });
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (user.subscriptionStatus !== "active") {
            console.log("[sync-role] サブスクリプションがアクティブではありません", {
                userId,
                status: user.subscriptionStatus,
            });
            return NextResponse.json({ error: "Subscription not active" }, { status: 403 });
        }

        if (!user.discordId) {
            console.log("[sync-role] Discord ID が未連携", { userId });
            return NextResponse.json({ error: "Discord ID not linked" }, { status: 400 });
        }

        // 2. Try to add role
        if (discordToken && guildId && roleId) {
            try {
                await rest.put(Routes.guildMemberRole(guildId, user.discordId, roleId));
                console.log("[sync-role] 成功: Discordロール付与完了", { discordId: user.discordId });
                return NextResponse.json({ success: true });
            } catch (error: unknown) {
                console.error("Failed to add Discord role:", error);
                // 404 means user is not in the server
                const status =
                    error instanceof Error && "status" in error ? (error as { status: number }).status : undefined;
                if (status === 404) {
                    return NextResponse.json(
                        { error: "User not in Discord server. Please join first." },
                        { status: 404 },
                    );
                }
                return NextResponse.json({ error: "Failed to assign role" }, { status: 500 });
            }
        } else {
            console.error("[sync-role] エラー: Discord環境変数が未設定");
            return NextResponse.json({ error: "Discord configuration missing" }, { status: 500 });
        }
    } catch (error: unknown) {
        console.error("[sync-role] エラー:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
