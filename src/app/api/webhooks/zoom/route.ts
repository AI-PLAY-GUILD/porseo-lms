import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { convex } from '@/lib/convex';

const ZOOM_WEBHOOK_SECRET = process.env.ZOOM_WEBHOOK_SECRET_TOKEN;
const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000; // 5 minutes

interface ZoomRecordingFile {
    id?: string;
    file_type?: string;
    status?: string;
    file_size?: number;
    recording_type?: string;
    download_url: string;
    recording_start?: string;
    recording_end?: string;
}

// Validate that download URLs are from Zoom domains (SSRF prevention)
function isValidZoomUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:' &&
            (parsed.hostname.endsWith('.zoom.us') || parsed.hostname.endsWith('.zoom.com'));
    } catch {
        return false;
    }
}

export async function POST(req: Request) {
    const body = await req.text();
    const headerPayload = await headers();
    const timestamp = headerPayload.get('x-zm-request-timestamp');
    const signature = headerPayload.get('x-zm-signature');

    // --- 1. Signature verification ---
    if (!ZOOM_WEBHOOK_SECRET) {
        console.error('ZOOM_WEBHOOK_SECRET_TOKEN is not configured');
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }

    if (!timestamp || !signature) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Replay attack prevention: validate timestamp freshness
    const timestampMs = parseInt(timestamp, 10) * 1000;
    if (isNaN(timestampMs) || Math.abs(Date.now() - timestampMs) > TIMESTAMP_TOLERANCE_MS) {
        console.error('Zoom webhook timestamp out of tolerance');
        return NextResponse.json({ error: 'Request expired' }, { status: 401 });
    }

    const message = `v0:${timestamp}:${body}`;
    const hashForVerify = crypto
        .createHmac('sha256', ZOOM_WEBHOOK_SECRET)
        .update(message)
        .digest('hex');
    const expectedSignature = `v0=${hashForVerify}`;

    // Constant-time comparison to prevent timing attacks
    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
        console.error('Zoom webhook signature verification failed');
        return NextResponse.json({ error: 'Verification failed' }, { status: 401 });
    }

    // Safe JSON parse
    let payload;
    try {
        payload = JSON.parse(body);
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // --- 2. CRC Challenge Response ---
    // Zoom sends this when registering the webhook endpoint URL
    if (payload.event === 'endpoint.url_validation') {
        const plainToken = payload.payload?.plainToken;
        if (!plainToken) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }
        const encryptedToken = crypto
            .createHmac('sha256', ZOOM_WEBHOOK_SECRET)
            .update(plainToken)
            .digest('hex');
        return NextResponse.json({ plainToken, encryptedToken });
    }

    // --- 3. Only handle recording.completed ---
    if (payload.event !== 'recording.completed') {
        return NextResponse.json({ received: true, ignored: true });
    }

    // --- 4. Idempotency check ---
    const eventTs = payload.event_ts;
    if (!eventTs) {
        console.error('Missing event_ts in Zoom webhook payload');
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    const eventId = `${payload.payload?.object?.uuid || ''}_${eventTs}`;

    try {
        const alreadyProcessed = await convex.query(
            // biome-ignore lint/suspicious/noExplicitAny: ConvexHttpClient requires string function reference
            "zoom:checkZoomEventProcessed" as any,
            { eventId, secret: process.env.CONVEX_INTERNAL_SECRET || "" }
        );
        if (alreadyProcessed) {
            return NextResponse.json({ received: true, duplicate: true });
        }
    } catch (error) {
        console.error('Zoom idempotency check failed, proceeding:', error);
    }

    // --- 5. Extract recording data ---
    const { object } = payload.payload;
    const meetingId = String(object?.id || '');
    const meetingTopic = (object?.topic || 'Zoom Recording').slice(0, 200);
    const recordingFiles: ZoomRecordingFile[] = object?.recording_files || [];
    const downloadToken = payload.download_token;

    if (!downloadToken) {
        console.error('No download_token in Zoom webhook payload');
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Select the largest MP4 file (best quality)
    const mp4File = recordingFiles
        .filter((f: ZoomRecordingFile) => f.file_type === 'MP4' && f.status === 'completed')
        .sort((a: ZoomRecordingFile, b: ZoomRecordingFile) => (b.file_size || 0) - (a.file_size || 0))[0];

    // VTT transcript file
    const vttFile = recordingFiles.find(
        (f: ZoomRecordingFile) => f.file_type === 'TRANSCRIPT' || f.recording_type === 'audio_transcript'
    );

    if (!mp4File) {
        console.error('No completed MP4 recording file found in Zoom payload');
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // SSRF prevention: validate download URLs are from Zoom domains
    if (!isValidZoomUrl(mp4File.download_url)) {
        console.error('Invalid MP4 download URL domain:', mp4File.download_url);
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    if (vttFile && !isValidZoomUrl(vttFile.download_url)) {
        console.error('Invalid VTT download URL domain:', vttFile.download_url);
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const mp4Url = `${mp4File.download_url}?access_token=${downloadToken}`;
    const vttUrl = vttFile
        ? `${vttFile.download_url}?access_token=${downloadToken}`
        : "";

    // Calculate duration from recording timestamps
    let duration = 0;
    if (mp4File.recording_end && mp4File.recording_start) {
        duration = (new Date(mp4File.recording_end).getTime() - new Date(mp4File.recording_start).getTime()) / 1000;
    }

    // --- 6. Create draft video + mark event as processed (atomic in mutation) ---
    try {
        // biome-ignore lint/suspicious/noExplicitAny: ConvexHttpClient requires string function reference
        await convex.mutation("zoom:createZoomDraftVideo" as any, {
            meetingId,
            meetingTopic,
            mp4DownloadUrl: mp4Url,
            vttDownloadUrl: vttUrl,
            recordingFileId: mp4File.id || `${meetingId}_${eventTs}`,
            duration,
            eventId,
            secret: process.env.CONVEX_INTERNAL_SECRET || "",
        });
    } catch (error: unknown) {
        console.error('Error creating Zoom draft video:', error);
        return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
    }

    return NextResponse.json({ received: true });
}
