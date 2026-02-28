import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { convex } from "@/lib/convex";
import { getZoomAccessToken } from "@/lib/zoom";
import { api } from "../../../../../convex/_generated/api";

function extractMeetingId(input: string): string {
    // パターン1: /j/ 形式のURL (https://zoom.us/j/12345678901)
    const meetingUrlMatch = input.match(/zoom\.us\/j\/(\d+)/);
    if (meetingUrlMatch) return meetingUrlMatch[1];

    // パターン2: 数字のみ (ミーティングID直接入力)
    const cleanId = input.replace(/[\s-]/g, "");
    if (/^\d{9,11}$/.test(cleanId)) return cleanId;

    throw new Error(
        "無効な入力です。ZoomミーティングID（数字9〜11桁）またはミーティングURL（/j/形式）を入力してください。",
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

        const body = await req.json();
        const { input } = body;
        if (!input || typeof input !== "string") {
            return NextResponse.json({ error: "入力が必要です" }, { status: 400 });
        }

        let meetingId: string;
        try {
            meetingId = extractMeetingId(input.trim());
        } catch (e) {
            return NextResponse.json({ error: (e as Error).message }, { status: 400 });
        }

        const accessToken = await getZoomAccessToken();
        const zoomRes = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}/recordings`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!zoomRes.ok) {
            if (zoomRes.status === 404) {
                return NextResponse.json(
                    { error: "録画が見つかりません。ミーティングIDを確認してください。" },
                    { status: 404 },
                );
            }
            const errText = await zoomRes.text();
            console.error("[zoom/recordings] Zoom APIエラー:", zoomRes.status, errText);
            return NextResponse.json({ error: `Zoom APIエラー: ${zoomRes.status}` }, { status: 500 });
        }

        const data = await zoomRes.json();
        const files: ZoomRecordingFile[] = data.recording_files || [];

        // MP4: 最大サイズのファイルを選択
        const mp4Files = files.filter((f: ZoomRecordingFile) => f.file_type === "MP4" && f.status === "completed");
        const mp4 = mp4Files.sort((a: ZoomRecordingFile, b: ZoomRecordingFile) => b.file_size - a.file_size)[0] || null;

        // VTT (文字起こし)
        const vtt = files.find((f: ZoomRecordingFile) => f.file_type === "TRANSCRIPT") || null;

        // CHAT
        const chat = files.find((f: ZoomRecordingFile) => f.file_type === "CHAT") || null;

        if (!mp4) {
            return NextResponse.json(
                {
                    error: "MP4録画ファイルが見つかりません。クラウドレコーディングが完了していることを確認してください。",
                },
                { status: 404 },
            );
        }

        // 録画時間を秒に変換
        let durationSeconds = 0;
        if (mp4.recording_start && mp4.recording_end) {
            durationSeconds = Math.round(
                (new Date(mp4.recording_end).getTime() - new Date(mp4.recording_start).getTime()) / 1000,
            );
        }

        return NextResponse.json({
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
        });
    } catch (error) {
        console.error("[zoom/recordings] エラー:", error);
        return NextResponse.json({ error: "内部エラーが発生しました" }, { status: 500 });
    }
}
