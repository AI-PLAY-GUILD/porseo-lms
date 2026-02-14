import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { convex } from '@/lib/convex';

const ZOOM_WEBHOOK_SECRET = process.env.ZOOM_WEBHOOK_SECRET_TOKEN;

export async function POST(req: Request) {
    const body = await req.text();
    const headerPayload = await headers();
    const timestamp = headerPayload.get('x-zm-request-timestamp');
    const signature = headerPayload.get('x-zm-signature');

    // --- 1. Signature verification ---
    if (!ZOOM_WEBHOOK_SECRET) {
        console.error('ZOOM_WEBHOOK_SECRET_TOKEN is not configured');
        return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    if (!timestamp || !signature) {
        return NextResponse.json({ error: 'Missing verification headers' }, { status: 400 });
    }

    const message = `v0:${timestamp}:${body}`;
    const hashForVerify = crypto
        .createHmac('sha256', ZOOM_WEBHOOK_SECRET)
        .update(message)
        .digest('hex');
    const expectedSignature = `v0=${hashForVerify}`;

    if (signature !== expectedSignature) {
        console.error('Zoom webhook signature verification failed');
        return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 });
    }

    const payload = JSON.parse(body);

    // --- 2. CRC Challenge Response ---
    // Zoom sends this when registering the webhook endpoint URL
    if (payload.event === 'endpoint.url_validation') {
        const plainToken = payload.payload?.plainToken;
        if (!plainToken) {
            return NextResponse.json({ error: 'Missing plainToken' }, { status: 400 });
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
    const eventId = `${payload.payload?.object?.uuid || ''}_${payload.event_ts || Date.now()}`;
    try {
        const alreadyProcessed = await convex.query(
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
    const meetingTopic = object?.topic || 'Zoom Recording';
    const recordingFiles = object?.recording_files || [];
    const downloadToken = payload.download_token;

    if (!downloadToken) {
        console.error('No download_token in Zoom webhook payload');
        return NextResponse.json({ error: 'Missing download_token' }, { status: 400 });
    }

    // Select the largest MP4 file (best quality)
    const mp4File = recordingFiles
        .filter((f: any) => f.file_type === 'MP4' && f.status === 'completed')
        .sort((a: any, b: any) => (b.file_size || 0) - (a.file_size || 0))[0];

    // VTT transcript file
    const vttFile = recordingFiles.find(
        (f: any) => f.file_type === 'TRANSCRIPT' || f.recording_type === 'audio_transcript'
    );

    if (!mp4File) {
        console.error('No completed MP4 recording file found in Zoom payload');
        return NextResponse.json({ error: 'No MP4 file found' }, { status: 400 });
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

    // --- 6. Create draft video in Convex ---
    try {
        await convex.mutation("zoom:createZoomDraftVideo" as any, {
            meetingId,
            meetingTopic,
            mp4DownloadUrl: mp4Url,
            vttDownloadUrl: vttUrl,
            recordingFileId: mp4File.id || `${meetingId}_${Date.now()}`,
            duration,
            eventId,
            secret: process.env.CONVEX_INTERNAL_SECRET || "",
        });
    } catch (error: any) {
        console.error('Error creating Zoom draft video:', error);
        return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
    }

    // --- 7. Mark event as processed ---
    try {
        await convex.mutation("zoom:markZoomEventProcessed" as any, {
            eventId,
            eventType: payload.event,
            secret: process.env.CONVEX_INTERNAL_SECRET || "",
        });
    } catch (error) {
        console.error('Failed to mark Zoom event as processed:', error);
    }

    return NextResponse.json({ received: true });
}
