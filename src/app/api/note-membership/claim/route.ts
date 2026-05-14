import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { api } from "../../../../../convex/_generated/api";
import { convex } from "@/lib/convex";
import { grantMembershipDiscordRole } from "@/lib/discord-membership";
import { getConvexInternalSecret } from "@/lib/env";

export async function POST(req: Request) {
    console.log("[note-membership/claim] リクエスト受信");
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { noteId, memberNumber, planName, externalAccount } = body as {
            noteId?: string;
            memberNumber?: string;
            planName?: string;
            externalAccount?: string;
        };

        if (!noteId?.trim()) {
            return NextResponse.json({ error: "note ID is required" }, { status: 400 });
        }

        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);
        const discordAccount = clerkUser.externalAccounts.find(
            (acc) => acc.provider === "oauth_discord" || acc.provider === "discord",
        );

        if (!discordAccount?.externalId) {
            return NextResponse.json({ error: "Discord account not linked" }, { status: 400 });
        }

        await convex.mutation(api.users.webhookSyncUser, {
            clerkId: userId,
            email: clerkUser.emailAddresses[0]?.emailAddress || "",
            name: clerkUser.fullName || clerkUser.username || "Unknown",
            imageUrl: clerkUser.imageUrl,
            secret: getConvexInternalSecret(),
        });

        await convex.mutation(api.users.setDiscordIdByClerkId, {
            clerkId: userId,
            discordId: discordAccount.externalId,
            secret: getConvexInternalSecret(),
        });

        const claim = await convex.mutation(api.noteMembership.claimByClerkId, {
            clerkId: userId,
            noteId,
            memberNumber,
            planName,
            externalAccount,
            secret: getConvexInternalSecret(),
        });

        let discordRoleWarning: string | undefined;
        if (claim.status === "active") {
            try {
                const tokenResponse = await client.users.getUserOauthAccessToken(userId, "oauth_discord");
                const accessToken = tokenResponse.data?.[0]?.token;
                const roleResult = await grantMembershipDiscordRole(discordAccount.externalId, accessToken);
                if (!roleResult.ok) discordRoleWarning = roleResult.warning;
            } catch (error) {
                console.error("[note-membership/claim] Discordロール付与失敗:", error);
                discordRoleWarning = "Discord role sync failed";
            }
        }

        return NextResponse.json({
            success: true,
            claim,
            discordRoleWarning,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[note-membership/claim] エラー:", message);

        if (message.includes("rejected") || message.includes("required") || message.includes("characters")) {
            return NextResponse.json({ error: message }, { status: 400 });
        }

        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
