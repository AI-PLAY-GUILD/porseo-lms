import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { convex } from "@/lib/convex";
import { getConvexInternalSecret } from "@/lib/env";
import { getZoomAccessToken, listZoomUsers } from "@/lib/zoom";
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

/**
 * 特定ユーザーの録画を30日チャンクで取得する。
 * Zoom APIは1リクエストあたり最大1ヶ月の日付範囲制限があるため分割する。
 */
async function fetchRecordingsForUser(
    accessToken: string,
    userId: string,
    fromDate: Date,
    toDate: Date,
): Promise<ZoomMeeting[]> {
    const meetings: ZoomMeeting[] = [];
    const chunkStart = new Date(fromDate);

    while (chunkStart < toDate) {
        const chunkEnd = new Date(chunkStart);
        chunkEnd.setDate(chunkEnd.getDate() + 30);
        if (chunkEnd > toDate) {
            chunkEnd.setTime(toDate.getTime());
        }

        const fromStr = chunkStart.toISOString().split("T")[0];
        const toStr = chunkEnd.toISOString().split("T")[0];

        // 同じ日付の場合はスキップ
        if (fromStr === toStr) {
            chunkStart.setDate(chunkStart.getDate() + 30);
            continue;
        }

        let nextPageToken = "";
        do {
            const params = new URLSearchParams({
                from: fromStr,
                to: toStr,
                page_size: "300",
            });
            if (nextPageToken) {
                params.set("next_page_token", nextPageToken);
            }

            const zoomRes = await fetch(`https://api.zoom.us/v2/users/${userId}/recordings?${params}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!zoomRes.ok) {
                const errBody = await zoomRes.text();
                console.error(
                    `[zoom/bulk-import] 録画一覧取得失敗 (user=${userId}, ${fromStr}~${toStr}):`,
                    zoomRes.status,
                    errBody,
                );
                break;
            }

            const data: ZoomRecordingsListResponse = await zoomRes.json();
            if (data.meetings) {
                meetings.push(...data.meetings);
            }
            nextPageToken = data.next_page_token || "";
        } while (nextPageToken);

        console.log(`[zoom/bulk-import] user=${userId} ${fromStr}~${toStr}: ${meetings.length}件（累計）`);

        chunkStart.setDate(chunkStart.getDate() + 30);
    }

    return meetings;
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

        // 1. Get the latest Zoom video date from DB
        const latestDate = await convex.query(api.zoom.getLatestZoomVideoDate, {
            secret: getConvexInternalSecret(),
        });

        // Calculate date range
        const today = new Date();

        let fromDate: Date;
        if (latestDate) {
            fromDate = new Date(latestDate);
        } else {
            fromDate = new Date();
            fromDate.setDate(fromDate.getDate() - 30);
        }

        const fromDateStr = fromDate.toISOString().split("T")[0];
        const toDateStr = today.toISOString().split("T")[0];

        // 2. Fetch all recordings from Zoom API
        // S2S OAuthではusers/meが動作しない場合があるため、
        // まずusers/meを試行し、失敗時はユーザー一覧から取得する。
        const accessToken = await getZoomAccessToken();
        let allMeetings: ZoomMeeting[] = [];

        // Step 1: users/me を試行
        console.log("[zoom/bulk-import] users/me で録画一覧取得を試行...");
        const meMeetings = await fetchRecordingsForUser(accessToken, "me", fromDate, today);

        if (meMeetings.length > 0) {
            allMeetings = meMeetings;
        } else {
            // Step 2: users/me が空 → 実際のユーザーIDで取得
            console.log("[zoom/bulk-import] users/me が空のため、ユーザー一覧から取得...");
            const userIds = await listZoomUsers(accessToken);

            if (userIds.length === 0) {
                return NextResponse.json(
                    { error: "Zoomユーザー一覧の取得に失敗しました。Zoom OAuthアプリのスコープを確認してください。" },
                    { status: 500 },
                );
            }

            for (const uid of userIds.slice(0, 10)) {
                const recordings = await fetchRecordingsForUser(accessToken, uid, fromDate, today);
                allMeetings.push(...recordings);
            }
        }

        console.log(`[zoom/bulk-import] 合計 ${allMeetings.length} 件の録画を取得`);

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

            // Find MP4 (largest) - moved up for recordingFileId
            const mp4Files = files.filter((f) => f.file_type === "MP4" && f.status === "completed");
            const mp4 = mp4Files.sort((a, b) => b.file_size - a.file_size)[0] || null;
            const recordingFileId = mp4?.id ? String(mp4.id) : undefined;

            // Check if already imported (by recordingFileId for recurring meetings)
            const alreadyImported = await convex.query(api.zoom.isZoomMeetingImported, {
                meetingId,
                recordingFileId,
                secret: getConvexInternalSecret(),
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
                    recordingFileId,
                    duration: durationSeconds,
                    secret: getConvexInternalSecret(),
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
            fromDate: fromDateStr,
            toDate: toDateStr,
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
