"use node";

import { GoogleGenAI } from "@google/genai";
import Mux from "@mux/mux-node";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalAction } from "./_generated/server";

// Validate that URLs are from Zoom domains (defense-in-depth SSRF prevention)
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

// ============================
// Mux Ingestion from Zoom Recording URL
// ============================
export const ingestToMux = internalAction({
    args: {
        videoId: v.id("videos"),
        mp4DownloadUrl: v.string(),
        vttDownloadUrl: v.string(), // empty string if no VTT
        chatDownloadUrl: v.optional(v.string()), // empty string if no chat
    },
    handler: async (ctx, args) => {
        console.log("[zoomActions:ingestToMux] 開始", {
            videoId: args.videoId,
            hasVtt: !!args.vttDownloadUrl,
            hasChat: !!args.chatDownloadUrl,
        });
        const tokenId = process.env.MUX_TOKEN_ID;
        const tokenSecret = process.env.MUX_TOKEN_SECRET;

        if (!tokenId || !tokenSecret) {
            console.error("[zoomActions:ingestToMux] MUX_TOKEN_ID or MUX_TOKEN_SECRET not set");
            // biome-ignore lint/suspicious/noExplicitAny: zoom module not yet in generated API types
            await ctx.runMutation((internal as any).zoom.updateVideoError, {
                videoId: args.videoId,
                error: "Mux credentials not configured",
            });
            return;
        }

        // Defense-in-depth: re-validate URLs even though webhook handler already checked
        const mp4BaseUrl = args.mp4DownloadUrl.split("?")[0];
        if (!isValidZoomUrl(mp4BaseUrl)) {
            console.error("[zoomActions:ingestToMux] 無効なMP4 URLドメイン:", mp4BaseUrl);
            // biome-ignore lint/suspicious/noExplicitAny: zoom module not yet in generated API types
            await ctx.runMutation((internal as any).zoom.updateVideoError, {
                videoId: args.videoId,
                error: "Invalid MP4 download URL domain",
            });
            return;
        }

        try {
            console.log("[zoomActions:ingestToMux] Muxアセット作成開始");
            // 1. Create Mux asset from Zoom recording URL
            const mux = new Mux({ tokenId, tokenSecret });

            const inputEntry: { url: string } = { url: args.mp4DownloadUrl };

            const assetConfig = {
                inputs: [inputEntry],
                playback_policy: ["public" as const],
            };

            const asset = await mux.video.assets.create(assetConfig);
            const playbackId = asset.playback_ids?.[0]?.id || "";
            console.log("[zoomActions:ingestToMux] Muxアセット作成完了", { assetId: asset.id, playbackId });

            // 2. Save Mux info to Convex
            // biome-ignore lint/suspicious/noExplicitAny: zoom module not yet in generated API types
            await ctx.runMutation((internal as any).zoom.updateVideoMuxInfo, {
                videoId: args.videoId,
                muxAssetId: asset.id,
                muxPlaybackId: playbackId,
            });

            // 3. Download VTT transcription if available
            if (args.vttDownloadUrl) {
                console.log("[zoomActions:ingestToMux] VTT文字起こしダウンロード開始");
                const vttBaseUrl = args.vttDownloadUrl.split("?")[0];
                if (!isValidZoomUrl(vttBaseUrl)) {
                    console.error("[zoomActions:ingestToMux] 無効なVTT URLドメイン:", vttBaseUrl);
                    // Non-fatal: skip VTT but don't fail the whole ingestion
                } else
                    try {
                        const vttResponse = await fetch(args.vttDownloadUrl);
                        if (vttResponse.ok) {
                            const vttText = await vttResponse.text();
                            if (vttText && vttText.trim().length > 0) {
                                console.log("[zoomActions:ingestToMux] VTT文字起こし保存", {
                                    vttLength: vttText.length,
                                });
                                // biome-ignore lint/suspicious/noExplicitAny: zoom module not yet in generated API types
                                await ctx.runMutation((internal as any).zoom.updateVideoTranscription, {
                                    videoId: args.videoId,
                                    transcription: vttText,
                                });

                                // 4. Schedule AI metadata generation
                                await ctx.scheduler.runAfter(
                                    30_000, // 30 seconds delay
                                    // biome-ignore lint/suspicious/noExplicitAny: zoomActions module not yet in generated API types
                                    (internal as any).zoomActions.processAiMetadata,
                                    {
                                        videoId: args.videoId,
                                        transcription: vttText,
                                    },
                                );
                            }
                        }
                    } catch (vttError) {
                        console.error("[zoomActions:ingestToMux] VTT文字起こし取得エラー:", vttError);
                        // Non-fatal: admin can add transcription manually later
                    }
            }

            // 5. Download chat messages if available
            if (args.chatDownloadUrl) {
                console.log("[zoomActions:ingestToMux] チャットメッセージダウンロード開始");
                const chatBaseUrl = args.chatDownloadUrl.split("?")[0];
                if (!isValidZoomUrl(chatBaseUrl)) {
                    console.error("[zoomActions:ingestToMux] 無効なChat URLドメイン:", chatBaseUrl);
                } else {
                    try {
                        const chatResponse = await fetch(args.chatDownloadUrl);
                        if (chatResponse.ok) {
                            const chatText = await chatResponse.text();
                            if (chatText && chatText.trim().length > 0) {
                                console.log("[zoomActions:ingestToMux] チャットメッセージ保存", {
                                    chatLength: chatText.length,
                                });
                                // biome-ignore lint/suspicious/noExplicitAny: zoom module not yet in generated API types
                                await ctx.runMutation((internal as any).zoom.updateVideoChatMessages, {
                                    videoId: args.videoId,
                                    chatMessages: chatText,
                                });
                            }
                        }
                    } catch (chatError) {
                        console.error("[zoomActions:ingestToMux] チャット取得エラー:", chatError);
                        // Non-fatal: chat is optional
                    }
                }
            }

            console.log("[zoomActions:ingestToMux] 完了", { videoId: args.videoId });
        } catch (error) {
            console.error("[zoomActions:ingestToMux] エラー:", error);
            // biome-ignore lint/suspicious/noExplicitAny: zoom module not yet in generated API types
            await ctx.runMutation((internal as any).zoom.updateVideoError, {
                videoId: args.videoId,
                error: `Mux ingest failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            });
        }
    },
});

// ============================
// AI Metadata Generation (summary + chapters)
// Reuses same prompt as convex/ai.ts
// ============================
export const processAiMetadata = internalAction({
    args: {
        videoId: v.id("videos"),
        transcription: v.string(),
    },
    handler: async (ctx, args) => {
        console.log("[zoomActions:processAiMetadata] 開始", {
            videoId: args.videoId,
            transcriptionLength: args.transcription?.length,
        });
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("[zoomActions:processAiMetadata] GEMINI_API_KEY未設定");
            return;
        }

        if (!args.transcription || args.transcription.trim().length === 0) {
            console.log("[zoomActions:processAiMetadata] 文字起こしテキストなし");
            return;
        }

        try {
            console.log("[zoomActions:processAiMetadata] Gemini API呼び出し開始");
            const client = new GoogleGenAI({ apiKey });

            // Same prompt as convex/ai.ts for consistency
            const prompt = `
あなたは教育動画のプロフェッショナルな編集者です。
以下の動画の文字起こしテキスト（VTT形式またはプレーンテキスト）を分析し、
学習者にとって有益な「要約」と「チャプター（目次）」を作成してください。

# 重要: JSON形式のみを出力してください
Markdownのコードブロック（\`\`\`jsonなど）は不要です。純粋なJSON文字列のみを出力してください。

## 出力フォーマット (JSON)
{
  "summary": "動画全体の要約（300文字程度で、学習のポイントを明確に）",
  "chapters": [
    {
      "startTime": 0,
      "title": "チャプターのタイトル",
      "description": "そのチャプターの内容（1文）"
    }
  ]
}

## 文字起こしデータ
${args.transcription}
`;

            const response = await client.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                config: { responseMimeType: "application/json" },
            });

            let responseText = "";
            const textOrFunc = (response as unknown as Record<string, unknown>).text;
            if (typeof textOrFunc === "function") {
                responseText = textOrFunc();
            } else if (textOrFunc) {
                responseText = textOrFunc as string;
            } else if (response.candidates && response.candidates.length > 0) {
                const candidate = response.candidates[0];
                if (candidate.content?.parts?.length) {
                    responseText = candidate.content.parts[0].text || "";
                }
            }

            if (!responseText) {
                console.error("[zoomActions:processAiMetadata] Geminiからの応答が空");
                return;
            }

            responseText = responseText.replace(/^```json\s*/, "").replace(/\s*```$/, "");

            let aiData;
            try {
                aiData = JSON.parse(responseText);
            } catch {
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    aiData = JSON.parse(jsonMatch[0]);
                } else {
                    console.error("[zoomActions:processAiMetadata] AI応答のJSONパース失敗");
                    return;
                }
            }

            // Reuse existing internal mutation from videos.ts
            console.log("[zoomActions:processAiMetadata] DB更新開始", { chaptersCount: aiData.chapters?.length });
            await ctx.runMutation(internal.videos.updateVideoAiMetadata, {
                videoId: args.videoId,
                summary: aiData.summary || "",
                chapters: aiData.chapters || [],
            });
            console.log("[zoomActions:processAiMetadata] 完了", { videoId: args.videoId });
        } catch (error) {
            console.error("[zoomActions:processAiMetadata] エラー:", error);
            // Non-fatal: admin can trigger AI analysis manually
        }
    },
});

// ============================
// Zoom録画の元の日付を取得して動画のcreatedAtを修正
// ============================
async function getZoomAccessToken(): Promise<string> {
    const accountId = process.env.ZOOM_ACCOUNT_ID;
    const clientId = process.env.ZOOM_CLIENT_ID;
    const clientSecret = process.env.ZOOM_CLIENT_SECRET;
    if (!accountId || !clientId || !clientSecret) {
        throw new Error("Missing Zoom OAuth credentials");
    }
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const response = await fetch("https://zoom.us/oauth/token", {
        method: "POST",
        headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            grant_type: "account_credentials",
            account_id: accountId,
        }),
    });
    if (!response.ok) throw new Error(`Zoom OAuth failed: ${response.status}`);
    const data = await response.json();
    return data.access_token;
}

interface VideoDateInfo {
    _id: string;
    title: string;
    createdAt: number;
    _creationTime: number;
    source?: string;
    zoomMeetingId?: string;
    zoomRecordingId?: string;
}

export const fixZoomVideoDates = internalAction({
    args: {},
    handler: async (ctx): Promise<{ total: number; updated: number; apiCalls: number }> => {
        console.log("[fixZoomVideoDates] 開始");

        // Get all videos with zoom meeting IDs
        const allVideos: VideoDateInfo[] = await ctx.runQuery(internal.videos.getAllVideoDateInfo, {});
        const zoomVideos: VideoDateInfo[] = allVideos.filter((v) => v.source === "zoom" && v.zoomMeetingId);

        console.log(`[fixZoomVideoDates] Zoom動画: ${zoomVideos.length}本`);

        const accessToken = await getZoomAccessToken();

        // Group by meetingId to reduce API calls (recurring meetings share the same ID)
        const meetingMap = new Map<string, Array<{ _id: string; zoomRecordingId?: string; title: string }>>();
        for (const v of zoomVideos) {
            const mid = v.zoomMeetingId!;
            if (!meetingMap.has(mid)) meetingMap.set(mid, []);
            meetingMap.get(mid)!.push(v);
        }

        console.log(`[fixZoomVideoDates] ユニークミーティング数: ${meetingMap.size}`);

        const updates: Array<{ videoId: Id<"videos">; createdAt: number }> = [];
        let apiCalls = 0;

        // First try: get recordings by meeting ID (past meetings endpoint for recurring)
        for (const [meetingId, videos] of meetingMap) {
            try {
                // For recurring meetings, list past instances first
                const instancesRes = await fetch(`https://api.zoom.us/v2/past_meetings/${meetingId}/instances`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
                apiCalls++;

                if (instancesRes.ok) {
                    const instancesData = await instancesRes.json();
                    const instances = instancesData.meetings || [];

                    if (instances.length > 0) {
                        // For each instance, get recordings
                        for (const instance of instances) {
                            const uuid = encodeURIComponent(encodeURIComponent(instance.uuid));
                            const recRes = await fetch(`https://api.zoom.us/v2/meetings/${uuid}/recordings`, {
                                headers: { Authorization: `Bearer ${accessToken}` },
                            });
                            apiCalls++;

                            if (recRes.ok) {
                                const recData = await recRes.json();
                                const startTime = recData.start_time;
                                if (!startTime) continue;

                                const recordingDate = new Date(startTime).getTime();
                                const recordingFiles = recData.recording_files || [];

                                for (const video of videos) {
                                    // Match by recording file ID
                                    const matched = recordingFiles.some(
                                        (f: { id: string }) => f.id === video.zoomRecordingId,
                                    );
                                    if (matched) {
                                        console.log(
                                            `[fixZoomVideoDates] マッチ: ${video.title.substring(0, 30)} → ${startTime}`,
                                        );
                                        updates.push({
                                            videoId: video._id as Id<"videos">,
                                            createdAt: recordingDate,
                                        });
                                    }
                                }
                            }

                            // Rate limit
                            await new Promise((r) => setTimeout(r, 200));
                        }
                        continue;
                    }
                }

                // Fallback: direct meeting recordings endpoint
                const recRes = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}/recordings`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
                apiCalls++;

                if (recRes.ok) {
                    const recData = await recRes.json();
                    const startTime = recData.start_time;
                    if (startTime) {
                        const recordingDate = new Date(startTime).getTime();
                        const recordingFiles = recData.recording_files || [];

                        for (const video of videos) {
                            const matched = recordingFiles.some((f: { id: string }) => f.id === video.zoomRecordingId);
                            if (matched) {
                                console.log(
                                    `[fixZoomVideoDates] マッチ(直接): ${video.title.substring(0, 30)} → ${startTime}`,
                                );
                                updates.push({
                                    videoId: video._id as Id<"videos">,
                                    createdAt: recordingDate,
                                });
                            }
                        }
                    }
                } else {
                    console.warn(`[fixZoomVideoDates] 録画取得失敗: meeting=${meetingId} status=${recRes.status}`);
                }

                // Rate limit
                await new Promise((r) => setTimeout(r, 200));
            } catch (err) {
                console.error(`[fixZoomVideoDates] エラー: meeting=${meetingId}`, err);
            }
        }

        console.log(`[fixZoomVideoDates] API呼び出し数: ${apiCalls}, マッチ数: ${updates.length}/${zoomVideos.length}`);

        // If not all matched, try bulk approach: list all recordings from users
        if (updates.length < zoomVideos.length) {
            console.log("[fixZoomVideoDates] 未マッチ動画あり。ユーザー録画一覧から検索...");

            const matchedIds = new Set(updates.map((u) => u.videoId));
            const unmatchedVideos = zoomVideos.filter((v: { _id: string }) => !matchedIds.has(v._id as Id<"videos">));
            const unmatchedRecIds = new Map(
                unmatchedVideos.map((v: { _id: string; zoomRecordingId?: string }) => [v.zoomRecordingId, v._id]),
            );

            // Get users
            const usersRes = await fetch("https://api.zoom.us/v2/users?page_size=30&status=active", {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            apiCalls++;

            if (usersRes.ok) {
                const usersData = await usersRes.json();
                const userIds = (usersData.users || []).map((u: { id: string }) => u.id);

                for (const userId of userIds) {
                    // Fetch recordings for the past 6 months in 30-day chunks
                    const now = new Date();
                    for (let monthsBack = 0; monthsBack < 6; monthsBack++) {
                        const to = new Date(now);
                        to.setMonth(to.getMonth() - monthsBack);
                        const from = new Date(to);
                        from.setMonth(from.getMonth() - 1);

                        const fromStr = from.toISOString().split("T")[0];
                        const toStr = to.toISOString().split("T")[0];

                        const listRes = await fetch(
                            `https://api.zoom.us/v2/users/${userId}/recordings?from=${fromStr}&to=${toStr}&page_size=300`,
                            { headers: { Authorization: `Bearer ${accessToken}` } },
                        );
                        apiCalls++;

                        if (listRes.ok) {
                            const listData = await listRes.json();
                            const meetings = listData.meetings || [];

                            for (const meeting of meetings) {
                                const startTime = meeting.start_time;
                                if (!startTime) continue;
                                const recordingDate = new Date(startTime).getTime();

                                for (const file of meeting.recording_files || []) {
                                    const videoIdStr = unmatchedRecIds.get(file.id);
                                    if (videoIdStr) {
                                        console.log(
                                            `[fixZoomVideoDates] ユーザー録画マッチ: ${file.id} → ${startTime}`,
                                        );
                                        updates.push({
                                            videoId: videoIdStr as Id<"videos">,
                                            createdAt: recordingDate,
                                        });
                                        unmatchedRecIds.delete(file.id);
                                    }
                                }
                            }
                        }

                        await new Promise((r) => setTimeout(r, 200));

                        if (unmatchedRecIds.size === 0) break;
                    }
                    if (unmatchedRecIds.size === 0) break;
                }
            }
        }

        console.log(`[fixZoomVideoDates] 最終マッチ数: ${updates.length}/${zoomVideos.length}`);

        // Apply updates in batches
        if (updates.length > 0) {
            const batchSize = 20;
            for (let i = 0; i < updates.length; i += batchSize) {
                await ctx.runMutation(internal.videos.batchUpdateCreatedAt, {
                    updates: updates.slice(i, i + batchSize),
                });
            }
            console.log(`[fixZoomVideoDates] ${updates.length}本の動画日付を更新完了`);
        }

        return {
            total: zoomVideos.length,
            updated: updates.length,
            apiCalls,
        };
    },
});
