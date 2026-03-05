import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { convex } from "@/lib/convex";
import { getConvexInternalSecret } from "@/lib/env";
import { getZoomAccessToken, listZoomUsers } from "@/lib/zoom";
import { api } from "../../../../../convex/_generated/api";

interface ZoomRecordingFile {
    id: string;
    file_type: string;
    recording_start: string;
    recording_end: string;
    status: string;
}

/**
 * POST /api/zoom/migrate-dates
 * Zoom APIから録画日時を取得し、既存動画のrecordedAtを設定するマイグレーション。
 */
export async function POST() {
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

        // 1. recordedAt未設定のZoom動画を取得
        const videos = await convex.query(api.videos.getZoomVideosWithoutRecordedAt, {});
        if (videos.length === 0) {
            return NextResponse.json({ message: "全てのZoom動画にrecordedAtが設定済みです", updated: 0 });
        }

        // 2. Zoom APIから録画一覧を取得（最大12ヶ月分）
        const accessToken = await getZoomAccessToken();
        const today = new Date();
        const recordings = new Map<string, string>(); // meetingId -> recording_start

        // users/meまたはユーザー一覧から録画を取得
        const fetchForUser = async (uid: string) => {
            for (let i = 0; i < 12; i++) {
                const chunkEnd = new Date(today);
                chunkEnd.setDate(chunkEnd.getDate() - i * 30);
                const chunkStart = new Date(today);
                chunkStart.setDate(chunkStart.getDate() - (i + 1) * 30);

                const fromStr = chunkStart.toISOString().split("T")[0];
                const toStr = chunkEnd.toISOString().split("T")[0];
                if (fromStr === toStr) continue;

                try {
                    const res = await fetch(
                        `https://api.zoom.us/v2/users/${uid}/recordings?from=${fromStr}&to=${toStr}&page_size=300`,
                        { headers: { Authorization: `Bearer ${accessToken}` } },
                    );
                    if (!res.ok) continue;
                    const data = await res.json();
                    for (const meeting of data.meetings || []) {
                        const mid = String(meeting.id);
                        if (meeting.start_time) {
                            recordings.set(mid, meeting.start_time);
                        }
                        // Also check individual recording files for more accurate start time
                        const files: ZoomRecordingFile[] = meeting.recording_files || [];
                        const mp4 = files.find((f) => f.file_type === "MP4" && f.status === "completed");
                        if (mp4?.recording_start) {
                            recordings.set(mid, mp4.recording_start);
                        }
                    }
                } catch (e) {
                    console.error(`[zoom/migrate-dates] fetch error (${uid}, ${fromStr}~${toStr}):`, e);
                }
            }
        };

        // Try users/me first
        await fetchForUser("me");

        // If not enough matches, try actual user IDs
        const matchedBefore = videos.filter((v) => v.zoomMeetingId && recordings.has(v.zoomMeetingId)).length;
        if (matchedBefore < videos.length) {
            const userIds = await listZoomUsers(accessToken);
            for (const uid of userIds.slice(0, 5)) {
                await fetchForUser(uid);
            }
        }

        console.log(`[zoom/migrate-dates] ${recordings.size}件の録画日時を取得`);

        // 3. マッチする動画のrecordedAtを更新
        const updates: { videoId: (typeof videos)[0]["_id"]; recordedAt: number }[] = [];
        for (const video of videos) {
            if (!video.zoomMeetingId) continue;
            const startTime = recordings.get(video.zoomMeetingId);
            if (startTime) {
                const ts = new Date(startTime).getTime();
                if (!Number.isNaN(ts)) {
                    updates.push({ videoId: video._id, recordedAt: ts });
                }
            }
        }

        if (updates.length === 0) {
            return NextResponse.json({
                message: "Zoom APIからマッチする録画日時が見つかりませんでした",
                totalVideos: videos.length,
                zoomRecordings: recordings.size,
                updated: 0,
            });
        }

        // 4. バッチ更新（25件ずつ）
        let totalUpdated = 0;
        for (let i = 0; i < updates.length; i += 25) {
            const batch = updates.slice(i, i + 25);
            const result = await convex.mutation(api.videos.batchSetRecordedAt, { updates: batch });
            totalUpdated += result.updated;
        }

        return NextResponse.json({
            message: `${totalUpdated}件のZoom動画にrecordedAtを設定しました`,
            totalVideos: videos.length,
            zoomRecordings: recordings.size,
            updated: totalUpdated,
            skipped: videos.length - totalUpdated,
        });
    } catch (error) {
        console.error("[zoom/migrate-dates] エラー:", error);
        return NextResponse.json({ error: "マイグレーションに失敗しました" }, { status: 500 });
    }
}
