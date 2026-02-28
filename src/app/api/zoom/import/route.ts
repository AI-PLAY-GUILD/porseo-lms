import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { convex } from "@/lib/convex";
import { getConvexInternalSecret } from "@/lib/env";
import { getZoomAccessToken } from "@/lib/zoom";
import { api } from "../../../../../convex/_generated/api";

// Validate that URLs are from Zoom domains (SSRF prevention)
function isValidZoomUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        return (
            parsed.protocol === "https:" &&
            (parsed.hostname.endsWith(".zoom.us") || parsed.hostname.endsWith(".zoom.com"))
        );
    } catch {
        return false;
    }
}

export async function POST(req: Request) {
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

        const body = await req.json();
        const { meetingId, topic, mp4DownloadUrl, vttDownloadUrl, chatDownloadUrl, duration } = body;

        if (!meetingId || !mp4DownloadUrl) {
            return NextResponse.json({ error: "meetingIdとmp4DownloadUrlは必須です" }, { status: 400 });
        }

        // SSRF prevention: validate download URLs
        const mp4BaseUrl = mp4DownloadUrl.split("?")[0];
        if (!isValidZoomUrl(mp4BaseUrl)) {
            return NextResponse.json({ error: "無効なMP4 URLドメインです" }, { status: 400 });
        }

        // Get fresh access token for download URLs
        const accessToken = await getZoomAccessToken();
        const mp4UrlWithToken = `${mp4DownloadUrl}?access_token=${accessToken}`;
        const vttUrlWithToken = vttDownloadUrl ? `${vttDownloadUrl}?access_token=${accessToken}` : "";

        // Download chat file if available
        let chatText = "";
        if (chatDownloadUrl) {
            const chatBaseUrl = chatDownloadUrl.split("?")[0];
            if (isValidZoomUrl(chatBaseUrl)) {
                try {
                    const chatRes = await fetch(`${chatDownloadUrl}?access_token=${accessToken}`);
                    if (chatRes.ok) {
                        chatText = await chatRes.text();
                    }
                } catch (e) {
                    console.error("[zoom/import] チャットダウンロードエラー:", e);
                    // Non-fatal: continue without chat
                }
            }
        }

        // Create video record and schedule Mux ingestion
        const videoId = await convex.mutation(api.zoom.createZoomManualImportVideo, {
            meetingId: String(meetingId),
            meetingTopic: topic || "Zoom録画",
            mp4DownloadUrl: mp4UrlWithToken,
            vttDownloadUrl: vttUrlWithToken,
            chatMessages: chatText || undefined,
            duration: Number(duration) || 0,
            secret: getConvexInternalSecret(),
        });

        return NextResponse.json({ videoId });
    } catch (error) {
        console.error("[zoom/import] エラー:", error);
        return NextResponse.json({ error: "取り込みに失敗しました" }, { status: 500 });
    }
}
