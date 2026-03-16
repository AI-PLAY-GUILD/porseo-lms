import { auth, clerkClient } from "@clerk/nextjs/server";
import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { convex } from "@/lib/convex";
import { getConvexInternalSecret } from "@/lib/env";
import { api } from "../../../../convex/_generated/api";

export async function POST(req: Request) {
    console.log("[activate-note-trial] リクエスト受信");
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { promoCode } = body;
        if (!promoCode) {
            return NextResponse.json({ error: "Missing promo code" }, { status: 400 });
        }

        // Get IP address
        const forwarded = req.headers.get("x-forwarded-for");
        const ip = forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
        const ipHash = createHash("sha256").update(ip).digest("hex");

        // Check IP already used
        // biome-ignore lint/suspicious/noExplicitAny: Convex codegen not available without `npx convex dev`
        const ipUsed = await convex.query((api as any).notePromo.checkIpUsed, {
            ipHash,
            secret: getConvexInternalSecret(),
        });
        if (ipUsed) {
            return NextResponse.json({ error: "このIPアドレスは既にトライアルに使用されています" }, { status: 409 });
        }

        // Get Discord ID from Clerk
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        const discordAccount = user.externalAccounts.find(
            (acc) => acc.provider === "oauth_discord" || acc.provider === "discord",
        );

        if (!discordAccount || !discordAccount.externalId) {
            return NextResponse.json({ error: "Discord account not linked" }, { status: 400 });
        }

        const discordId = discordAccount.externalId;

        // Activate trial in Convex
        // biome-ignore lint/suspicious/noExplicitAny: Convex codegen not available without `npx convex dev`
        const result = await convex.mutation((api as any).notePromo.activateNoteTrial, {
            clerkId: userId,
            promoCode,
            ipAddress: ip,
            ipHash,
            discordId,
            secret: getConvexInternalSecret(),
        });

        // Join Discord server (using user's OAuth token)
        try {
            const response = await client.users.getUserOauthAccessToken(userId, "oauth_discord");
            if (response.data && response.data.length > 0) {
                const accessToken = response.data[0].token;
                const guildId = process.env.DISCORD_GUILD_ID;
                const botToken = process.env.DISCORD_BOT_TOKEN;
                const roleId = process.env.DISCORD_ROLE_ID;

                if (guildId && botToken) {
                    // Add to server
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 10000);
                    try {
                        await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${discordId}`, {
                            method: "PUT",
                            headers: {
                                Authorization: `Bot ${botToken}`,
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({ access_token: accessToken }),
                            signal: controller.signal,
                        });
                    } finally {
                        clearTimeout(timeoutId);
                    }

                    // Add role
                    if (roleId) {
                        const roleController = new AbortController();
                        const roleTimeoutId = setTimeout(() => roleController.abort(), 10000);
                        try {
                            await fetch(
                                `https://discord.com/api/v10/guilds/${guildId}/members/${discordId}/roles/${roleId}`,
                                {
                                    method: "PUT",
                                    headers: { Authorization: `Bot ${botToken}` },
                                    signal: roleController.signal,
                                },
                            );
                        } finally {
                            clearTimeout(roleTimeoutId);
                        }
                    }
                }
            }
        } catch (discordError) {
            console.error("[activate-note-trial] Discord連携エラー (トライアルは有効化済み):", discordError);
        }

        console.log("[activate-note-trial] 成功", { userId, discordId });
        return NextResponse.json({ success: true, trialExpiresAt: result.trialExpiresAt });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal server error";
        console.error("[activate-note-trial] エラー:", message);

        if (message.includes("already")) {
            return NextResponse.json({ error: message }, { status: 409 });
        }
        if (
            message.includes("Invalid") ||
            message.includes("inactive") ||
            message.includes("expired") ||
            message.includes("max redemptions")
        ) {
            return NextResponse.json({ error: message }, { status: 400 });
        }

        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
