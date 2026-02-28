"use node";

import { GoogleGenAI } from "@google/genai";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 120_000; // 2 minutes
const THUMBNAIL_WIDTH = 1280;
const BATCH_SIZE = 50; // images per Gemini request
const CONCURRENT_DOWNLOADS = 10;

// biome-ignore lint/suspicious/noExplicitAny: videoSecurityDb module not yet in generated API types
const vsDb = (internal as any).videoSecurityDb;
// biome-ignore lint/suspicious/noExplicitAny: self-reference for scheduler
const vsSelf = (internal as any).videoSecurity;

// ============================
// Security Scan Action
// ============================

export const runSecurityScan = internalAction({
    args: {
        videoId: v.id("videos"),
        retryCount: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const retryCount = args.retryCount ?? 0;
        console.log("[videoSecurity:runSecurityScan] 開始", {
            videoId: args.videoId,
            retryCount,
        });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("[videoSecurity:runSecurityScan] GEMINI_API_KEY未設定");
            await ctx.runMutation(vsDb.updateSecurityScanStatus, {
                videoId: args.videoId,
                status: "error",
            });
            return;
        }

        // 1. Get video info
        const video = await ctx.runQuery(vsDb.getVideoForScan, {
            videoId: args.videoId,
        });

        if (!video) {
            console.error("[videoSecurity:runSecurityScan] 動画が見つかりません");
            return;
        }

        if (!video.muxPlaybackId) {
            console.log("[videoSecurity:runSecurityScan] muxPlaybackIdなし、スキップ");
            return;
        }

        // 2. Update status to scanning
        await ctx.runMutation(vsDb.updateSecurityScanStatus, {
            videoId: args.videoId,
            status: "scanning",
        });

        // 3. Check if Mux asset is ready by testing first thumbnail
        const testUrl = `https://image.mux.com/${video.muxPlaybackId}/thumbnail.jpg?time=0&width=${THUMBNAIL_WIDTH}`;
        try {
            const testResponse = await fetch(testUrl, { method: "HEAD" });
            if (!testResponse.ok) {
                if (retryCount < MAX_RETRIES) {
                    console.log("[videoSecurity:runSecurityScan] Muxアセット未準備、リトライスケジュール", {
                        retryCount: retryCount + 1,
                    });
                    await ctx.runMutation(vsDb.updateSecurityScanStatus, {
                        videoId: args.videoId,
                        status: "pending",
                    });
                    await ctx.scheduler.runAfter(RETRY_DELAY_MS, vsSelf.runSecurityScan, {
                        videoId: args.videoId,
                        retryCount: retryCount + 1,
                    });
                    return;
                }
                console.error("[videoSecurity:runSecurityScan] Muxアセット取得失敗、リトライ上限");
                await ctx.runMutation(vsDb.updateSecurityScanStatus, {
                    videoId: args.videoId,
                    status: "error",
                });
                return;
            }
        } catch (error) {
            console.error("[videoSecurity:runSecurityScan] サムネイルテストエラー:", error);
            if (retryCount < MAX_RETRIES) {
                await ctx.runMutation(vsDb.updateSecurityScanStatus, {
                    videoId: args.videoId,
                    status: "pending",
                });
                await ctx.scheduler.runAfter(RETRY_DELAY_MS, vsSelf.runSecurityScan, {
                    videoId: args.videoId,
                    retryCount: retryCount + 1,
                });
                return;
            }
            await ctx.runMutation(vsDb.updateSecurityScanStatus, {
                videoId: args.videoId,
                status: "error",
            });
            return;
        }

        // 4. Generate thumbnail timestamps
        const duration = video.duration || 60; // default 60s if unknown
        const interval = duration > 3600 ? 30 : 15; // 30s for 60min+, else 15s
        const timestamps: number[] = [];
        for (let t = 0; t < duration; t += interval) {
            timestamps.push(t);
        }

        console.log("[videoSecurity:runSecurityScan] サムネイル取得開始", {
            count: timestamps.length,
            interval,
            duration,
        });

        // 5. Download thumbnails in parallel batches
        const thumbnails: { timestamp: number; base64: string }[] = [];

        for (let i = 0; i < timestamps.length; i += CONCURRENT_DOWNLOADS) {
            const batch = timestamps.slice(i, i + CONCURRENT_DOWNLOADS);
            const results = await Promise.allSettled(
                batch.map(async (ts) => {
                    const url = `https://image.mux.com/${video.muxPlaybackId}/thumbnail.jpg?time=${ts}&width=${THUMBNAIL_WIDTH}`;
                    const response = await fetch(url);
                    if (!response.ok) return null;
                    const buffer = await response.arrayBuffer();
                    const base64 = Buffer.from(buffer).toString("base64");
                    return { timestamp: ts, base64 };
                }),
            );

            for (const result of results) {
                if (result.status === "fulfilled" && result.value) {
                    thumbnails.push(result.value);
                }
            }
        }

        if (thumbnails.length === 0) {
            console.error("[videoSecurity:runSecurityScan] サムネイル取得失敗");
            await ctx.runMutation(vsDb.updateSecurityScanStatus, {
                videoId: args.videoId,
                status: "error",
            });
            return;
        }

        console.log("[videoSecurity:runSecurityScan] サムネイル取得完了", {
            count: thumbnails.length,
        });

        // 6. Analyze with Gemini in batches
        const client = new GoogleGenAI({ apiKey });
        const allFindings: {
            timestamp: number;
            severity: string;
            type: string;
            description: string;
            detectedText?: string;
        }[] = [];

        for (let i = 0; i < thumbnails.length; i += BATCH_SIZE) {
            const batch = thumbnails.slice(i, i + BATCH_SIZE);

            const timestampInfo = batch.map((t, idx) => `フレーム${idx + 1}: ${t.timestamp}秒`).join(", ");

            const prompt = `あなたはサイバーセキュリティの専門家です。
以下の動画フレーム（スクリーンショット）を分析し、
画面上に表示されているセキュリティ上の機密情報を検出してください。

## 検出対象
1. 環境変数 (.envファイル、KEY=VALUE形式の設定)
2. APIキー / アクセストークン (AWS, Google Cloud, Stripe, GitHub, etc.)
3. パスワード / シークレット (ログインフォーム、ターミナル出力)
4. データベース接続文字列 (postgres://, mongodb://, redis://)
5. SSH秘密鍵 / 証明書
6. 個人情報 (メールアドレス、電話番号、クレジットカード番号)

## 各フレームの時間情報
${timestampInfo}

## 出力フォーマット (JSON)
{
  "findings": [
    {
      "frameIndex": 0,
      "timestamp": 30,
      "severity": "critical",
      "type": "api_key",
      "description": "AWSアクセスキーがターミナルに表示されています",
      "detectedText": "AKIA****XXXX (マスク済み)"
    }
  ]
}

## 重要な注意事項
- 機密情報が見つかった場合、detectedTextは必ずマスク処理してください（例: sk-****abcd）
- コードエディタやターミナルが映っている場合は特に注意深く分析してください
- 機密情報が見つからない場合はfindingsを空配列にしてください
- severity: "critical" | "high" | "medium" | "low"
- type: "env_variable" | "api_key" | "password" | "connection_string" | "ssh_key" | "token" | "pii" | "other"`;

            // Build parts: prompt text + all images
            // biome-ignore lint/suspicious/noExplicitAny: Gemini SDK Part type complexity
            const parts: any[] = [{ text: prompt }];
            for (const thumb of batch) {
                parts.push({
                    inlineData: {
                        mimeType: "image/jpeg",
                        data: thumb.base64,
                    },
                });
            }

            try {
                console.log("[videoSecurity:runSecurityScan] Gemini分析開始", {
                    batchIndex: Math.floor(i / BATCH_SIZE),
                    batchSize: batch.length,
                });

                const response = await client.models.generateContent({
                    model: "gemini-3.1-pro-preview",
                    contents: [{ role: "user", parts }],
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
                    console.error("[videoSecurity:runSecurityScan] Geminiからの応答が空");
                    continue;
                }

                responseText = responseText.replace(/^```json\s*/, "").replace(/\s*```$/, "");

                let parsed: {
                    findings?: Array<{
                        frameIndex?: number;
                        timestamp?: number;
                        severity?: string;
                        type?: string;
                        description?: string;
                        detectedText?: string;
                    }>;
                };
                try {
                    parsed = JSON.parse(responseText);
                } catch {
                    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        parsed = JSON.parse(jsonMatch[0]);
                    } else {
                        console.error("[videoSecurity:runSecurityScan] JSONパース失敗");
                        continue;
                    }
                }

                if (parsed.findings && Array.isArray(parsed.findings)) {
                    for (const finding of parsed.findings) {
                        // Resolve timestamp from frameIndex if needed
                        let ts = finding.timestamp ?? 0;
                        if (finding.frameIndex !== undefined && finding.frameIndex < batch.length) {
                            ts = batch[finding.frameIndex].timestamp;
                        }

                        allFindings.push({
                            timestamp: ts,
                            severity: finding.severity || "medium",
                            type: finding.type || "other",
                            description: finding.description || "不明な機密情報",
                            detectedText: finding.detectedText,
                        });
                    }
                }

                console.log("[videoSecurity:runSecurityScan] バッチ分析完了", {
                    findingsInBatch: parsed.findings?.length || 0,
                });
            } catch (error) {
                console.error("[videoSecurity:runSecurityScan] Gemini分析エラー:", error);
                // Continue with next batch
            }
        }

        // 7. Save results
        const status = allFindings.length > 0 ? "warning" : "clean";
        await ctx.runMutation(vsDb.updateSecurityFindings, {
            videoId: args.videoId,
            status,
            findings: allFindings,
        });

        console.log("[videoSecurity:runSecurityScan] 完了", {
            videoId: args.videoId,
            status,
            findingsCount: allFindings.length,
        });
    },
});
