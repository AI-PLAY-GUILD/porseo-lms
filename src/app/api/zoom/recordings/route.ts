import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { convex } from "@/lib/convex";
import { getConvexInternalSecret } from "@/lib/env";
import { getZoomAccessToken, listZoomUsers, resolveShareUrl } from "@/lib/zoom";
import { api } from "../../../../../convex/_generated/api";

type ParsedInput = { type: "meetingId"; meetingId: string } | { type: "shareUrl"; shareUrl: string };

function parseZoomInput(input: string): ParsedInput {
    // パターン1: /rec/share/ 形式の共有URL
    if (/zoom\.us\/rec\/share\//.test(input)) {
        try {
            const url = new URL(input);
            if (url.hostname.endsWith(".zoom.us")) {
                return { type: "shareUrl", shareUrl: input };
            }
        } catch {
            // URL解析失敗 → 下のパターンへ
        }
    }

    // パターン2: /j/ 形式のURL (https://zoom.us/j/12345678901)
    const meetingUrlMatch = input.match(/zoom\.us\/j\/(\d+)/);
    if (meetingUrlMatch) return { type: "meetingId", meetingId: meetingUrlMatch[1] };

    // パターン3: 数字のみ (ミーティングID直接入力)
    const cleanId = input.replace(/[\s-]/g, "");
    if (/^\d{9,11}$/.test(cleanId)) return { type: "meetingId", meetingId: cleanId };

    throw new Error(
        "無効な入力です。ZoomミーティングID（数字9〜11桁）、ミーティングURL（/j/形式）、または共有録画URL（/rec/share/形式）を入力してください。",
    );
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
    total_size: number;
    share_url?: string;
    recording_files: ZoomRecordingFile[];
}

async function fetchRecordingsByMeetingId(meetingId: string, accessToken: string) {
    const zoomRes = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}/recordings`, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!zoomRes.ok) {
        if (zoomRes.status === 404) {
            return { error: "録画が見つかりません。ミーティングIDを確認してください。", status: 404 };
        }
        const errText = await zoomRes.text();
        console.error("[zoom/recordings] Zoom APIエラー:", zoomRes.status, errText);
        return { error: `Zoom APIエラー: ${zoomRes.status}`, status: 500 };
    }

    const data = await zoomRes.json();
    const files: ZoomRecordingFile[] = data.recording_files || [];

    const mp4Files = files.filter((f: ZoomRecordingFile) => f.file_type === "MP4" && f.status === "completed");
    const mp4 = mp4Files.sort((a: ZoomRecordingFile, b: ZoomRecordingFile) => b.file_size - a.file_size)[0] || null;
    const vtt = files.find((f: ZoomRecordingFile) => f.file_type === "TRANSCRIPT") || null;
    const chat = files.find((f: ZoomRecordingFile) => f.file_type === "CHAT") || null;

    if (!mp4) {
        return {
            error: "MP4録画ファイルが見つかりません。クラウドレコーディングが完了していることを確認してください。",
            status: 404,
        };
    }

    let durationSeconds = 0;
    if (mp4.recording_start && mp4.recording_end) {
        durationSeconds = Math.round(
            (new Date(mp4.recording_end).getTime() - new Date(mp4.recording_start).getTime()) / 1000,
        );
    }

    return {
        data: {
            type: "recording" as const,
            meetingId,
            topic: data.topic || "Zoom録画",
            duration: durationSeconds,
            recordings: {
                mp4: {
                    download_url: mp4.download_url,
                    file_size: mp4.file_size,
                    recording_start: mp4.recording_start,
                    recording_end: mp4.recording_end,
                },
                vtt: vtt ? { download_url: vtt.download_url } : null,
                chat: chat ? { download_url: chat.download_url } : null,
            },
        },
    };
}

/**
 * 特定ユーザーの録画を30日チャンクで最大90日分取得する。
 */
async function fetchRecordingsForUser(accessToken: string, userId: string): Promise<ZoomMeeting[]> {
    const today = new Date();
    const meetings: ZoomMeeting[] = [];

    for (let i = 0; i < 3; i++) {
        const chunkEnd = new Date(today);
        chunkEnd.setDate(chunkEnd.getDate() - i * 30);
        const chunkStart = new Date(today);
        chunkStart.setDate(chunkStart.getDate() - (i + 1) * 30);

        const params = new URLSearchParams({
            from: chunkStart.toISOString().split("T")[0],
            to: chunkEnd.toISOString().split("T")[0],
            page_size: "100",
        });

        const zoomRes = await fetch(`https://api.zoom.us/v2/users/${userId}/recordings?${params}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!zoomRes.ok) {
            const errBody = await zoomRes.text();
            console.error(`[zoom/recordings] 録画一覧取得失敗 (user=${userId}):`, zoomRes.status, errBody);
            continue;
        }

        const data = await zoomRes.json();
        const chunk: ZoomMeeting[] = data.meetings || [];
        console.log(
            `[zoom/recordings] user=${userId} ${chunkStart.toISOString().split("T")[0]}~${chunkEnd.toISOString().split("T")[0]}: ${chunk.length}件`,
        );
        meetings.push(...chunk);

        if (meetings.length >= 50) break;
    }

    return meetings;
}

/**
 * 直近90日の録画を取得する。
 * まず users/me を試行し、空の場合はユーザー一覧から各ユーザーの録画を取得する。
 */
async function fetchRecentRecordings(accessToken: string): Promise<ZoomMeeting[]> {
    // Step 1: users/me を試行（一部のS2S OAuth設定で動作する）
    console.log("[zoom/recordings] users/me で録画一覧取得を試行...");
    const meRecordings = await fetchRecordingsForUser(accessToken, "me");

    if (meRecordings.length > 0) {
        return filterAndSort(meRecordings);
    }

    // Step 2: users/me が空 → 実際のユーザーIDで取得
    console.log("[zoom/recordings] users/me が空のため、ユーザー一覧から取得...");
    const userIds = await listZoomUsers(accessToken);
    const allMeetings: ZoomMeeting[] = [];

    for (const uid of userIds.slice(0, 5)) {
        const recordings = await fetchRecordingsForUser(accessToken, uid);
        allMeetings.push(...recordings);
        if (allMeetings.length >= 50) break;
    }

    return filterAndSort(allMeetings);
}

function filterAndSort(meetings: ZoomMeeting[]): ZoomMeeting[] {
    return meetings
        .filter((m) => {
            const files = m.recording_files || [];
            return files.some((f) => f.file_type === "MP4" && f.status === "completed");
        })
        .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
}

/**
 * 共有URLのトークン部分を抽出する（比較用）。
 * 例: https://us06web.zoom.us/rec/share/TOKEN.SUFFIX → TOKEN
 */
function extractShareToken(url: string): string | null {
    const match = url.match(/\/rec\/share\/([^?.\s]+)/);
    return match ? match[1] : null;
}

/**
 * 録画一覧の share_url から入力された共有URLにマッチする録画を探す。
 */
function findMatchingRecording(shareUrl: string, meetings: ZoomMeeting[]): ZoomMeeting | null {
    const inputToken = extractShareToken(shareUrl);
    if (!inputToken || inputToken.length < 10) return null;

    for (const m of meetings) {
        if (!m.share_url) continue;
        const apiToken = extractShareToken(m.share_url);
        if (apiToken && inputToken === apiToken) {
            return m;
        }
    }

    return null;
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
        const { input } = body;
        if (!input || typeof input !== "string") {
            return NextResponse.json({ error: "入力が必要です" }, { status: 400 });
        }

        let parsed: ParsedInput;
        try {
            parsed = parseZoomInput(input.trim());
        } catch (e) {
            return NextResponse.json({ error: (e as Error).message }, { status: 400 });
        }

        const accessToken = await getZoomAccessToken();

        // 共有URL処理
        if (parsed.type === "shareUrl") {
            // Step 1: HTMLスクレイピングでミーティングID抽出を試行（低確率で成功）
            const resolvedId = await resolveShareUrl(parsed.shareUrl);
            if (resolvedId) {
                console.log("[zoom/recordings] HTMLからミーティングID抽出成功:", resolvedId);
                const result = await fetchRecordingsByMeetingId(resolvedId, accessToken);
                if ("error" in result) {
                    return NextResponse.json({ error: result.error }, { status: result.status });
                }
                return NextResponse.json(result.data);
            }

            // Step 2: API録画一覧を取得し、share_urlでマッチング
            console.log("[zoom/recordings] HTMLスクレイピング失敗、API経由でshare_urlマッチングを試行...");
            const recentMeetings = await fetchRecentRecordings(accessToken);

            const matched = findMatchingRecording(parsed.shareUrl, recentMeetings);
            if (matched) {
                console.log("[zoom/recordings] share_urlマッチ成功:", matched.id, matched.topic);
                const result = await fetchRecordingsByMeetingId(String(matched.id), accessToken);
                if (!("error" in result)) {
                    return NextResponse.json(result.data);
                }
            }

            // Step 3: マッチなし → 録画一覧を返して手動選択
            if (recentMeetings.length === 0) {
                console.warn("[zoom/recordings] 共有URL解決失敗かつ直近90日の録画なし");
                return NextResponse.json(
                    {
                        error: "共有URLからの自動検出に失敗しました。このURLが他のZoomアカウントの録画の場合、API経由ではアクセスできません。録画の所有者にミーティングIDを確認してください。",
                    },
                    { status: 404 },
                );
            }

            return NextResponse.json({
                type: "selectRecording",
                message: "共有URLからの自動検出に失敗しました。以下の直近録画から該当するものを選択してください。",
                recordings: recentMeetings.map((m) => {
                    const mp4Files = (m.recording_files || []).filter(
                        (f) => f.file_type === "MP4" && f.status === "completed",
                    );
                    const mp4 = mp4Files.sort((a, b) => b.file_size - a.file_size)[0];
                    return {
                        meetingId: String(m.id),
                        topic: m.topic || "Zoom録画",
                        startTime: m.start_time,
                        duration: m.duration,
                        totalSize: m.total_size || mp4?.file_size || 0,
                    };
                }),
            });
        }

        // ミーティングID: 既存フロー
        const result = await fetchRecordingsByMeetingId(parsed.meetingId, accessToken);
        if ("error" in result) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        return NextResponse.json(result.data);
    } catch (error) {
        console.error("[zoom/recordings] エラー:", error);
        return NextResponse.json({ error: "内部エラーが発生しました" }, { status: 500 });
    }
}
