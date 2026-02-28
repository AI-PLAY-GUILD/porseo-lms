import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { convex } from "@/lib/convex";
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

interface ZoomRecordingFile {
    id: string;
    file_type: string;
    file_size: number;
    download_url: string;
    status: string;
    recording_start: string;
    recording_end: string;
}

interface ZoomMeeting {
    uuid: string;
    id: number;
    topic: string;
    start_time: string;
    duration: number;
    recording_files: ZoomRecordingFile[];
}

interface ZoomRecordingsListResponse {
    from: string;
    to: string;
    page_size: number;
    total_records: number;
    next_page_token?: string;
    meetings: ZoomMeeting[];
}

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await convex.query(api.users.getUserByClerkIdServer, {
            clerkId: userId,
            secret: process.env.CONVEX_INTERNAL_SECRET || "",
        });
        if (!user?.isAdmin) {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        // 1. Get the latest Zoom video date from DB
        const latestDate = await convex.query(api.zoom.getLatestZoomVideoDate, {
            secret: process.env.CONVEX_INTERNAL_SECRET || "",
        });

        // Calculate date range
        const today = new Date();
        const toDate = today.toISOString().split("T")[0]; // YYYY-MM-DD

        let fromDate: string;
        if (latestDate) {
            // Start from the day of the last recording
            const d = new Date(latestDate);
            fromDate = d.toISOString().split("T")[0];
        } else {
            // No existing recordings - go back 30 days
            const d = new Date();
            d.setDate(d.getDate() - 30);
            fromDate = d.toISOString().split("T")[0];
        }

        // 2. Fetch all recordings from Zoom API (with pagination)
        const accessToken = await getZoomAccessToken();
        const allMeetings: ZoomMeeting[] = [];
        let nextPageToken = "";

        do {
            const params = new URLSearchParams({
                from: fromDate,
                to: toDate,
                page_size: "300",
            });
            if (nextPageToken) {
                params.set("next_page_token", nextPageToken);
            }

            const zoomRes = await fetch(`https://api.zoom.us/v2/users/me/recordings?${params}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!zoomRes.ok) {
                const errText = await zoomRes.text();
                console.error("[zoom/bulk-import] Zoom APIエラー:", zoomRes.status, errText);
                return NextResponse.json({ error: `Zoom APIエラー: ${zoomRes.status}` }, { status: 500 });
            }

            const data: ZoomRecordingsListResponse = await zoomRes.json();
            if (data.meetings) {
                allMeetings.push(...data.meetings);
            }
            nextPageToken = data.next_page_token || "";
        } while (nextPageToken);

        // 3. Process each meeting and import
        const results: {
            meetingId: string;
            topic: string;
            status: "imported" | "skipped" | "error";
            reason?: string;
        }[] = [];

        for (const meeting of allMeetings) {
            const meetingId = String(meeting.id);
            const files = meeting.recording_files || [];

            // Check if already imported
            const alreadyImported = await convex.query(api.zoom.isZoomMeetingImported, {
                meetingId,
                secret: process.env.CONVEX_INTERNAL_SECRET || "",
            });
            if (alreadyImported) {
                results.push({
                    meetingId,
                    topic: meeting.topic,
                    status: "skipped",
                    reason: "既に登録済み",
                });
                continue;
            }

            // Find MP4 (largest)
            const mp4Files = files.filter((f) => f.file_type === "MP4" && f.status === "completed");
            const mp4 = mp4Files.sort((a, b) => b.file_size - a.file_size)[0] || null;

            if (!mp4) {
                results.push({
                    meetingId,
                    topic: meeting.topic,
                    status: "skipped",
                    reason: "MP4ファイルなし",
                });
                continue;
            }

            // SSRF check
            const mp4BaseUrl = mp4.download_url.split("?")[0];
            if (!isValidZoomUrl(mp4BaseUrl)) {
                results.push({
                    meetingId,
                    topic: meeting.topic,
                    status: "skipped",
                    reason: "無効なURLドメイン",
                });
                continue;
            }

            // Find VTT and Chat
            const vtt = files.find((f) => f.file_type === "TRANSCRIPT") || null;
            const chat = files.find((f) => f.file_type === "CHAT") || null;

            // Calculate duration
            let durationSeconds = 0;
            if (mp4.recording_start && mp4.recording_end) {
                durationSeconds = Math.round(
                    (new Date(mp4.recording_end).getTime() - new Date(mp4.recording_start).getTime()) / 1000,
                );
            }

            // Get fresh token for download URLs
            const freshToken = await getZoomAccessToken();
            const mp4UrlWithToken = `${mp4.download_url}?access_token=${freshToken}`;
            const vttUrlWithToken = vtt ? `${vtt.download_url}?access_token=${freshToken}` : "";

            // Download chat file if available
            let chatText = "";
            if (chat) {
                const chatBaseUrl = chat.download_url.split("?")[0];
                if (isValidZoomUrl(chatBaseUrl)) {
                    try {
                        const chatRes = await fetch(`${chat.download_url}?access_token=${freshToken}`);
                        if (chatRes.ok) {
                            chatText = await chatRes.text();
                        }
                    } catch (e) {
                        console.error("[zoom/bulk-import] チャットDLエラー:", e);
                    }
                }
            }

            try {
                await convex.mutation(api.zoom.createZoomManualImportVideo, {
                    meetingId,
                    meetingTopic: meeting.topic || "Zoom録画",
                    mp4DownloadUrl: mp4UrlWithToken,
                    vttDownloadUrl: vttUrlWithToken,
                    chatMessages: chatText || undefined,
                    duration: durationSeconds,
                    secret: process.env.CONVEX_INTERNAL_SECRET || "",
                });

                results.push({
                    meetingId,
                    topic: meeting.topic,
                    status: "imported",
                });
            } catch (error) {
                console.error("[zoom/bulk-import] インポートエラー:", meetingId, error);
                results.push({
                    meetingId,
                    topic: meeting.topic,
                    status: "error",
                    reason: error instanceof Error ? error.message : "不明なエラー",
                });
            }
        }

        const imported = results.filter((r) => r.status === "imported").length;
        const skipped = results.filter((r) => r.status === "skipped").length;
        const errors = results.filter((r) => r.status === "error").length;

        return NextResponse.json({
            fromDate,
            toDate,
            totalFound: allMeetings.length,
            imported,
            skipped,
            errors,
            results,
        });
    } catch (error) {
        console.error("[zoom/bulk-import] エラー:", error);
        return NextResponse.json({ error: "一括取り込みに失敗しました" }, { status: 500 });
    }
}
