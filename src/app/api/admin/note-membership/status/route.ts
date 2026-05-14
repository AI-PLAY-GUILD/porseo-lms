import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { convex } from "@/lib/convex";
import { applyMembershipRoleUpdates } from "@/lib/discord-membership";
import { getConvexInternalSecret } from "@/lib/env";

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { claimId, status, reviewNote } = body as {
            claimId?: string;
            status?: string;
            reviewNote?: string;
        };

        if (!claimId || !status) {
            return NextResponse.json({ error: "claimId and status are required" }, { status: 400 });
        }

        const result = await convex.mutation(api.noteMembership.reviewClaimByIdServer, {
            adminClerkId: userId,
            claimId: claimId as Id<"noteMembershipClaims">,
            status,
            reviewNote,
            secret: getConvexInternalSecret(),
        });

        const roleSync = result.roleUpdate ? await applyMembershipRoleUpdates([result.roleUpdate]) : null;

        return NextResponse.json({ success: true, result, roleSync });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[admin/note-membership/status] エラー:", message);
        if (message.includes("Unauthorized")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
