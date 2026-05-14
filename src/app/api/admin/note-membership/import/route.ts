import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { api } from "../../../../../../convex/_generated/api";
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
        const { rows, revokeMissing } = body as {
            rows?: Array<{
                noteId: string;
                memberNumber?: string;
                planName?: string;
                externalAccount?: string;
            }>;
            revokeMissing?: boolean;
        };

        if (!Array.isArray(rows) || rows.length === 0) {
            return NextResponse.json({ error: "rows are required" }, { status: 400 });
        }

        const result = await convex.mutation(api.noteMembership.importCsvRowsServer, {
            adminClerkId: userId,
            rows,
            revokeMissing: !!revokeMissing,
            secret: getConvexInternalSecret(),
        });

        const roleSync = await applyMembershipRoleUpdates(result.roleUpdates);
        return NextResponse.json({ success: true, result, roleSync });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[admin/note-membership/import] エラー:", message);
        if (message.includes("Unauthorized")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
