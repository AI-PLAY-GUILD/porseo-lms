import { auth } from "@clerk/nextjs/server";
import Mux from "@mux/mux-node";
import { type NextRequest, NextResponse } from "next/server";
import { convex } from "@/lib/convex";
import { getConvexInternalSecret } from "@/lib/env";
import { api } from "../../../../../convex/_generated/api";

const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
});

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await convex.query(api.users.getUserByClerkIdServer, {
            clerkId: userId,
            secret: getConvexInternalSecret(),
        });
        if (!user?.isAdmin) {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        const uploadId = req.nextUrl.searchParams.get("uploadId");
        if (!uploadId) {
            return NextResponse.json({ error: "uploadId is required" }, { status: 400 });
        }

        const upload = await mux.video.uploads.retrieve(uploadId);

        if (!upload.asset_id) {
            return NextResponse.json({ status: "waiting", message: "Asset not yet created" });
        }

        const asset = await mux.video.assets.retrieve(upload.asset_id);
        const playbackId = asset.playback_ids?.[0]?.id || null;

        return NextResponse.json({
            status: asset.status,
            muxAssetId: asset.id,
            muxPlaybackId: playbackId,
            duration: asset.duration || null,
        });
    } catch (error) {
        console.error("[mux/upload-status] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
