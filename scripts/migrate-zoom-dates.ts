/**
 * Zoom動画のrecordedAtマイグレーションスクリプト
 *
 * 使い方: npx tsx scripts/migrate-zoom-dates.ts
 *
 * 既存のZoom動画にrecordedAt（実際の撮影日時）を設定する。
 * Zoom APIから直近12ヶ月の録画一覧を取得し、meetingIdでマッチングする。
 */

import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
const CONVEX_INTERNAL_SECRET =
    process.env.CONVEX_INTERNAL_SECRET || "6a69a97736bb96053c413b231df097a498130428a2478356348046025e64f3cd";
const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;
const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;

if (!CONVEX_URL) {
    console.error("Missing NEXT_PUBLIC_CONVEX_URL");
    process.exit(1);
}
if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
    console.error("Missing ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, or ZOOM_CLIENT_SECRET");
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
        body: new URLSearchParams({
            grant_type: "account_credentials",
            account_id: ZOOM_ACCOUNT_ID!,
        }),
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

interface ZoomRecordingFile {
    id: string;
    file_type: string;
    recording_start: string;
    status: string;
}

async function fetchRecordings(token: string, userId: string): Promise<Map<string, string>> {
    const recordings = new Map<string, string>();
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
                const mid = String(meeting.id);
                if (meeting.start_time) {
                    recordings.set(mid, meeting.start_time);
                }
                const files: ZoomRecordingFile[] = meeting.recording_files || [];
                const mp4 = files.find((f) => f.file_type === "MP4" && f.status === "completed");
                if (mp4?.recording_start) {
                    recordings.set(mid, mp4.recording_start);
                }
            }
            console.log(`   ${userId} ${fromStr}~${toStr}: ${recordings.size} total`);
        } catch (e) {
            console.error(`   Error fetching ${userId} ${fromStr}~${toStr}:`, e);
        }
    }
    return recordings;
}

async function main() {
    const convex = new ConvexHttpClient(CONVEX_URL!);

    // 1. Get Zoom videos without recordedAt
    console.log("1. Getting Zoom videos without recordedAt...");
    const zoomVideos = await convex.query(api.videos.getZoomVideosWithoutRecordedAt, {
        secret: CONVEX_INTERNAL_SECRET,
    });
    console.log(`   Found ${zoomVideos.length} Zoom videos without recordedAt`);

    if (zoomVideos.length === 0) {
        console.log("   All Zoom videos already have recordedAt set!");
        return;
    }

    // List them
    for (const v of zoomVideos) {
        console.log(
            `   - ${v.title} (meetingId: ${v.zoomMeetingId || "N/A"}, createdAt: ${new Date(v.createdAt).toLocaleDateString("ja-JP")})`,
        );
    }

    // 2. Fetch recording dates from Zoom API
    console.log("\n2. Fetching recording dates from Zoom API (up to 12 months)...");
    const token = await getZoomAccessToken();
    const allRecordings = await fetchRecordings(token, "me");

    // Check match rate
    const matchedBefore = zoomVideos.filter((v) => v.zoomMeetingId && allRecordings.has(v.zoomMeetingId)).length;
    console.log(`   Matched ${matchedBefore}/${zoomVideos.length} with users/me`);

    if (matchedBefore < zoomVideos.length) {
        console.log("   Trying user list...");
        const userIds = await listZoomUsers(token);
        for (const uid of userIds.slice(0, 5)) {
            const userRecordings = await fetchRecordings(token, uid);
            for (const [k, v] of userRecordings) {
                allRecordings.set(k, v);
            }
        }
        console.log(`   Total recordings: ${allRecordings.size}`);
    }

    // 3. Match and prepare updates
    console.log("\n3. Matching videos to recording dates...");
    const updates: { videoId: (typeof zoomVideos)[0]["_id"]; recordedAt: number; title: string }[] = [];
    const unmatched: string[] = [];

    for (const video of zoomVideos) {
        if (!video.zoomMeetingId) {
            unmatched.push(`${video.title} (no meetingId)`);
            continue;
        }
        const startTime = allRecordings.get(video.zoomMeetingId);
        if (startTime) {
            const ts = new Date(startTime).getTime();
            if (!Number.isNaN(ts)) {
                updates.push({ videoId: video._id, recordedAt: ts, title: video.title });
            }
        } else {
            unmatched.push(`${video.title} (meetingId: ${video.zoomMeetingId})`);
        }
    }

    console.log(`   Matched: ${updates.length}, Unmatched: ${unmatched.length}`);

    if (unmatched.length > 0) {
        console.log("\n   Unmatched videos:");
        for (const name of unmatched) {
            console.log(`     - ${name}`);
        }
    }

    if (updates.length === 0) {
        console.log("\n   No matches found. Recordings may be older than 12 months.");
        return;
    }

    // 4. Preview changes
    console.log("\n4. Changes to apply:");
    for (const update of updates) {
        const date = new Date(update.recordedAt).toLocaleDateString("ja-JP");
        console.log(`   - ${update.title}: recordedAt = ${date}`);
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
