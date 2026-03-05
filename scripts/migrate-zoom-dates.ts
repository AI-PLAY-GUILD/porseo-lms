/**
 * Zoom動画のrecordedAtマイグレーションスクリプト (v2 - recordingFileIdベース)
 *
 * 使い方: npx tsx scripts/migrate-zoom-dates.ts
 *
 * 既存のZoom動画にrecordedAt（実際の撮影日時）を設定する。
 * zoomRecordingId（個別のファイルID）でマッチングし、定期ミーティングでも正確な日付を取得。
 */

import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "";
const CONVEX_INTERNAL_SECRET =
    process.env.CONVEX_INTERNAL_SECRET || "6a69a97736bb96053c413b231df097a498130428a2478356348046025e64f3cd";
const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID || "";
const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID || "";
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET || "";

if (!CONVEX_URL || !ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
    console.error("Missing required env vars");
    process.exit(1);
}

async function getZoomAccessToken(): Promise<string> {
    const credentials = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString("base64");
    const res = await fetch("https://zoom.us/oauth/token", {
        method: "POST",
        headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ grant_type: "account_credentials", account_id: ZOOM_ACCOUNT_ID }),
    });
    if (!res.ok) throw new Error(`Zoom OAuth failed: ${res.status}`);
    const data = await res.json();
    return data.access_token;
}

async function listZoomUsers(token: string): Promise<string[]> {
    const res = await fetch("https://api.zoom.us/v2/users?page_size=30&status=active", {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.users || []).map((u: { id: string }) => u.id);
}

interface RecordingInfo {
    recordingStart: string;
    meetingTopic: string;
    meetingId: string;
}

async function fetchRecordingsByFileId(token: string, userId: string): Promise<Map<string, RecordingInfo>> {
    const recordings = new Map<string, RecordingInfo>();
    const today = new Date();

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
                `https://api.zoom.us/v2/users/${userId}/recordings?from=${fromStr}&to=${toStr}&page_size=300`,
                { headers: { Authorization: `Bearer ${token}` } },
            );
            if (!res.ok) continue;
            const data = await res.json();
            for (const meeting of data.meetings || []) {
                for (const file of meeting.recording_files || []) {
                    if (file.file_type === "MP4" && file.status === "completed" && file.id) {
                        recordings.set(String(file.id), {
                            recordingStart: file.recording_start || meeting.start_time,
                            meetingTopic: meeting.topic || "",
                            meetingId: String(meeting.id),
                        });
                    }
                }
            }
            console.log(`   ${userId} ${fromStr}~${toStr}: ${recordings.size} files total`);
        } catch (e) {
            console.error(`   Error: ${userId} ${fromStr}~${toStr}:`, e);
        }
    }
    return recordings;
}

async function main() {
    const convex = new ConvexHttpClient(CONVEX_URL);

    // 1. Get ALL Zoom videos from Convex (including those with incorrect recordedAt)
    console.log("1. Getting all Zoom videos from Convex...");
    const zoomVideos = await convex.query(api.videos.getZoomVideosForMigration, {
        secret: CONVEX_INTERNAL_SECRET,
        includeAll: true,
    });
    console.log(`   Found ${zoomVideos.length} Zoom videos`);

    const withRecordingId = zoomVideos.filter((v) => v.zoomRecordingId);
    const withoutRecordingId = zoomVideos.filter((v) => !v.zoomRecordingId);
    console.log(`   With zoomRecordingId: ${withRecordingId.length}`);
    console.log(`   Without zoomRecordingId: ${withoutRecordingId.length}`);

    // 2. Fetch all recording file IDs from Zoom API
    console.log("\n2. Fetching Zoom recording file IDs (12 months)...");
    const token = await getZoomAccessToken();
    const allRecordings = await fetchRecordingsByFileId(token, "me");

    // Try user list too
    const userIds = await listZoomUsers(token);
    for (const uid of userIds.slice(0, 5)) {
        const userRecordings = await fetchRecordingsByFileId(token, uid);
        for (const [k, v] of userRecordings) {
            allRecordings.set(k, v);
        }
    }
    console.log(`   Total: ${allRecordings.size} recording files from Zoom API`);

    // 3. Match by zoomRecordingId (primary) or by meetingId+createdAt proximity (fallback)
    console.log("\n3. Matching videos...");
    type VideoInfo = (typeof zoomVideos)[0];
    const updates: { videoId: VideoInfo["_id"]; recordedAt: number; title: string; method: string }[] = [];
    const unmatched: string[] = [];

    // Build meetingId -> recordings map for fallback
    const meetingIdRecordings = new Map<string, { date: string; fileId: string }[]>();
    for (const [fileId, info] of allRecordings) {
        const existing = meetingIdRecordings.get(info.meetingId) || [];
        existing.push({ date: info.recordingStart, fileId });
        meetingIdRecordings.set(info.meetingId, existing);
    }

    for (const video of zoomVideos) {
        // Primary: match by zoomRecordingId
        if (video.zoomRecordingId) {
            const info = allRecordings.get(video.zoomRecordingId);
            if (info) {
                const ts = new Date(info.recordingStart).getTime();
                if (!Number.isNaN(ts)) {
                    updates.push({
                        videoId: video._id,
                        recordedAt: ts,
                        title: video.title,
                        method: "recordingId",
                    });
                    continue;
                }
            }
        }

        // Fallback: match by meetingId + closest createdAt
        if (video.zoomMeetingId) {
            const recordings = meetingIdRecordings.get(video.zoomMeetingId);
            if (recordings && recordings.length > 0) {
                // Find the recording closest to the video's createdAt
                let bestMatch = recordings[0];
                let bestDiff = Math.abs(new Date(bestMatch.date).getTime() - video.createdAt);
                for (const rec of recordings) {
                    const diff = Math.abs(new Date(rec.date).getTime() - video.createdAt);
                    if (diff < bestDiff) {
                        bestDiff = diff;
                        bestMatch = rec;
                    }
                }
                const ts = new Date(bestMatch.date).getTime();
                // Only accept if within 7 days of createdAt
                if (!Number.isNaN(ts) && bestDiff < 7 * 24 * 60 * 60 * 1000) {
                    updates.push({
                        videoId: video._id,
                        recordedAt: ts,
                        title: video.title,
                        method: "meetingId+date",
                    });
                    continue;
                }
            }
        }

        unmatched.push(
            `${video.title} (recordingId: ${video.zoomRecordingId || "N/A"}, meetingId: ${video.zoomMeetingId || "N/A"})`,
        );
    }

    console.log(
        `   Matched: ${updates.length} (${updates.filter((u) => u.method === "recordingId").length} by recordingId, ${updates.filter((u) => u.method === "meetingId+date").length} by meetingId+date)`,
    );
    console.log(`   Unmatched: ${unmatched.length}`);

    if (unmatched.length > 0) {
        console.log("\n   Unmatched videos:");
        for (const name of unmatched) {
            console.log(`     - ${name}`);
        }
    }

    if (updates.length === 0) {
        console.log("\n   No matches found.");
        return;
    }

    // 4. Preview changes
    console.log("\n4. Changes to apply:");
    for (const update of updates) {
        const currentVideo = zoomVideos.find((v) => v._id === update.videoId);
        const oldDate = currentVideo?.recordedAt
            ? new Date(currentVideo.recordedAt).toLocaleDateString("ja-JP")
            : "N/A";
        const newDate = new Date(update.recordedAt).toLocaleDateString("ja-JP");
        const changed = oldDate !== newDate ? " ***" : "";
        console.log(`   - ${update.title}: ${oldDate} -> ${newDate} [${update.method}]${changed}`);
    }

    // 5. Apply updates in batches
    console.log("\n5. Applying updates...");
    let totalUpdated = 0;
    for (let i = 0; i < updates.length; i += 25) {
        const batch = updates.slice(i, i + 25);
        const result = await convex.mutation(api.videos.batchSetRecordedAt, {
            updates: batch.map((u) => ({ videoId: u.videoId, recordedAt: u.recordedAt })),
            secret: CONVEX_INTERNAL_SECRET,
        });
        totalUpdated += result.updated;
        console.log(`   Batch ${Math.floor(i / 25) + 1}: ${result.updated} updated`);
    }

    console.log(`\nDone! Updated recordedAt for ${totalUpdated} videos.`);
}

main().catch(console.error);
