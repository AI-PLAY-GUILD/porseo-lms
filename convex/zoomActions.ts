"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import Mux from "@mux/mux-node";
import { GoogleGenAI } from "@google/genai";

// Validate that URLs are from Zoom domains (defense-in-depth SSRF prevention)
function isValidZoomUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        return parsed.protocol === "https:" &&
            (parsed.hostname.endsWith(".zoom.us") || parsed.hostname.endsWith(".zoom.com"));
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
    },
    handler: async (ctx, args) => {
        const tokenId = process.env.MUX_TOKEN_ID;
        const tokenSecret = process.env.MUX_TOKEN_SECRET;

        if (!tokenId || !tokenSecret) {
            console.error("MUX_TOKEN_ID or MUX_TOKEN_SECRET not set");
            await ctx.runMutation((internal as any).zoom.updateVideoError, {
                videoId: args.videoId,
                error: "Mux credentials not configured",
            });
            return;
        }

        // Defense-in-depth: re-validate URLs even though webhook handler already checked
        const mp4BaseUrl = args.mp4DownloadUrl.split("?")[0];
        if (!isValidZoomUrl(mp4BaseUrl)) {
            console.error("Invalid MP4 URL domain in ingestToMux:", mp4BaseUrl);
            await ctx.runMutation((internal as any).zoom.updateVideoError, {
                videoId: args.videoId,
                error: "Invalid MP4 download URL domain",
            });
            return;
        }

        try {
            // 1. Create Mux asset from Zoom recording URL
            const mux = new Mux({ tokenId, tokenSecret });

            const assetConfig: any = {
                input: [{ url: args.mp4DownloadUrl }],
                playback_policy: ["public"],
            };

            // If no VTT provided, enable Mux auto-subtitles for Japanese
            if (!args.vttDownloadUrl) {
                assetConfig.input[0].generated_subtitles = [
                    { language_code: "ja", name: "Japanese" },
                ];
            }

            const asset = await mux.video.assets.create(assetConfig);
            const playbackId = asset.playback_ids?.[0]?.id || "";

            // 2. Save Mux info to Convex
            await ctx.runMutation((internal as any).zoom.updateVideoMuxInfo, {
                videoId: args.videoId,
                muxAssetId: asset.id,
                muxPlaybackId: playbackId,
            });

            // 3. Download VTT transcription if available
            if (args.vttDownloadUrl) {
                const vttBaseUrl = args.vttDownloadUrl.split("?")[0];
                if (!isValidZoomUrl(vttBaseUrl)) {
                    console.error("Invalid VTT URL domain in ingestToMux:", vttBaseUrl);
                    // Non-fatal: skip VTT but don't fail the whole ingestion
                } else
                try {
                    const vttResponse = await fetch(args.vttDownloadUrl);
                    if (vttResponse.ok) {
                        const vttText = await vttResponse.text();
                        if (vttText && vttText.trim().length > 0) {
                            await ctx.runMutation((internal as any).zoom.updateVideoTranscription, {
                                videoId: args.videoId,
                                transcription: vttText,
                            });

                            // 4. Schedule AI metadata generation
                            await ctx.scheduler.runAfter(
                                30_000, // 30 seconds delay
                                (internal as any).zoomActions.processAiMetadata,
                                {
                                    videoId: args.videoId,
                                    transcription: vttText,
                                }
                            );
                        }
                    }
                } catch (vttError) {
                    console.error("Failed to fetch VTT transcription:", vttError);
                    // Non-fatal: admin can add transcription manually later
                }
            }
        } catch (error) {
            console.error("Mux ingest failed:", error);
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
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("GEMINI_API_KEY not set, skipping AI processing for Zoom recording");
            return;
        }

        if (!args.transcription || args.transcription.trim().length === 0) {
            return;
        }

        try {
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
                model: "gemini-1.5-flash",
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                config: { responseMimeType: "application/json" },
            });

            let responseText = "";
            const textOrFunc = (response as any).text;
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
                console.error("Empty response from Gemini for Zoom recording");
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
                    console.error("Failed to parse AI response for Zoom recording");
                    return;
                }
            }

            // Reuse existing internal mutation from videos.ts
            await ctx.runMutation(internal.videos.updateVideoAiMetadata, {
                videoId: args.videoId,
                summary: aiData.summary || "",
                chapters: aiData.chapters || [],
            });
        } catch (error) {
            console.error("AI processing for Zoom recording failed:", error);
            // Non-fatal: admin can trigger AI analysis manually
        }
    },
});
