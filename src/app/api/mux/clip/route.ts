import { auth } from "@clerk/nextjs/server";
import Mux from "@mux/mux-node";
import { type NextRequest, NextResponse } from "next/server";
import { convex } from "@/lib/convex";
import { getConvexInternalSecret } from "@/lib/env";
import { api } from "../../../../../../convex/_generated/api";

const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
});

interface TrimRequest {
    mode: "trim";
    assetId: string;
    startTime: number;
    endTime: number;
    title: string;
}

interface MergeClip {
    assetId: string;
    startTime: number;
    endTime: number;
}

interface MergeRequest {
    mode: "merge";
    clips: MergeClip[];
    title: string;
}

type ClipRequest = TrimRequest | MergeRequest;

export async function POST(req: NextRequest) {
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

        const body = (await req.json()) as ClipRequest;

        if (body.mode === "trim") {
            if (!body.assetId || body.startTime === undefined || body.endTime === undefined) {
                return NextResponse.json({ error: "assetId, startTime, endTime are required" }, { status: 400 });
            }
            if (body.startTime >= body.endTime) {
                return NextResponse.json({ error: "startTime must be less than endTime" }, { status: 400 });
            }

            const asset = await mux.video.assets.create({
                input: [
                    {
                        url: `mux://${body.assetId}`,
                        start_time: body.startTime,
                        end_time: body.endTime,
                    },
                ],
                playback_policy: ["public"],
            });

            const playbackId = asset.playback_ids?.[0]?.id || "";

            return NextResponse.json({
                assetId: asset.id,
                playbackId,
                status: asset.status,
                duration: body.endTime - body.startTime,
            });
        }

        if (body.mode === "merge") {
            if (!body.clips || body.clips.length < 2) {
                return NextResponse.json({ error: "At least 2 clips are required for merge" }, { status: 400 });
            }

            for (const clip of body.clips) {
                if (!clip.assetId) {
                    return NextResponse.json({ error: "Each clip must have an assetId" }, { status: 400 });
                }
                if (clip.startTime !== undefined && clip.endTime !== undefined && clip.startTime >= clip.endTime) {
                    return NextResponse.json(
                        { error: "startTime must be less than endTime for each clip" },
                        { status: 400 },
                    );
                }
            }

            const input = body.clips.map((clip) => {
                const entry: { url: string; start_time?: number; end_time?: number } = {
                    url: `mux://${clip.assetId}`,
                };
                if (clip.startTime !== undefined && clip.startTime > 0) {
                    entry.start_time = clip.startTime;
                }
                if (clip.endTime !== undefined && clip.endTime > 0) {
                    entry.end_time = clip.endTime;
                }
                return entry;
            });

            const asset = await mux.video.assets.create({
                input,
                playback_policy: ["public"],
            });

            const playbackId = asset.playback_ids?.[0]?.id || "";

            return NextResponse.json({
                assetId: asset.id,
                playbackId,
                status: asset.status,
            });
        }

        return NextResponse.json({ error: "Invalid mode. Use 'trim' or 'merge'" }, { status: 400 });
    } catch (error) {
        console.error("[mux/clip] エラー:", error);
        return NextResponse.json(
            { error: `クリップ作成エラー: ${error instanceof Error ? error.message : "Unknown error"}` },
            { status: 500 },
        );
    }
}
