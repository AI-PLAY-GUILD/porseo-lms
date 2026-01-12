"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { GoogleGenAI } from "@google/genai";
import Mux from "@mux/mux-node";

const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID!,
    tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export const generateVideoMetadata = action({
    args: {
        videoId: v.id("videos"),
        muxAssetId: v.optional(v.string()),
        transcription: v.optional(v.string()), // クライアントから直接渡される文字起こし
    },
    handler: async (ctx, args) => {
        try {
            console.log("Generating metadata for video:", args.videoId);

            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

            // 1. 文字起こしテキストの取得
            let subtitleText = args.transcription || "";

            if (!subtitleText) {
                const video = await ctx.runQuery(api.videos.getById, { videoId: args.videoId });
                if (video && video.transcription) {
                    subtitleText = video.transcription;
                }
            }

            if (!subtitleText || subtitleText.trim().length === 0) {
                throw new Error("文字起こしテキストがありません。入力欄にテキストを入力するか、ファイルを読み込んでください。");
            }

            console.log("Using transcription text length:", subtitleText.length);

            // 2. Geminiで分析 (New SDK)
            const client = new GoogleGenAI({ apiKey: apiKey });

            const prompt = `
あなたは教育動画のプロフェッショナルな編集者です。
以下の動画の文字起こしテキスト（VTT形式またはプレーンテキスト）を分析し、
学習者にとって有益な「要約」と「チャプター（目次）」を作成してください。

# 重要: JSON形式のみを出力してください
Markdownのコードブロックや、説明文は一切不要です。純粋なJSONのみを出力してください。

## 出力フォーマット (JSON)
{
  "summary": "動画全体の要約（300文字程度で、学習のポイントを明確に）",
  "chapters": [
    {
      "startTime": 0, // 秒単位の開始時間 (数値)
      "title": "チャプターのタイトル",
      "description": "そのチャプターの内容（1文）"
    },
    ...
  ]
}

## 文字起こしデータ
${subtitleText}
`;

            let responseText = "";
            const response = await client.models.generateContent({
                model: "gemini-flash-latest",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                },
            });

            // 新しいSDKのレスポンス構造に合わせてテキストを取得
            if (response.text) {
                responseText = response.text;
            } else if (response.candidates && response.candidates.length > 0) {
                // フォールバック
                const candidate = response.candidates[0];
                if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                    const part = candidate.content.parts[0];
                    if (part.text) {
                        responseText = part.text;
                    }
                }
            }

            if (!responseText) {
                console.error("Empty response from Gemini:", JSON.stringify(response, null, 2));
                throw new Error("AIからの応答が空でした。");
            }

            console.log("Gemini Response:", responseText);

            // JSONパース
            let aiData;
            try {
                aiData = JSON.parse(responseText);
            } catch (e) {
                console.log("JSON Parse failed, trying regex extraction...");
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    try {
                        aiData = JSON.parse(jsonMatch[0]);
                    } catch (e2) {
                        console.error("Regex extraction failed:", e2);
                        throw new Error("AIからの応答をJSONとして解析できませんでした。");
                    }
                } else {
                    throw new Error("AIからの応答に有効なJSONが含まれていませんでした。");
                }
            }

            // 4. DB更新
            await ctx.runMutation(api.videos.updateVideoAiMetadata, {
                videoId: args.videoId,
                summary: aiData.summary,
                chapters: aiData.chapters,
            });

            return aiData;

        } catch (error: any) {
            console.error("Gemini API Error:", error);
            // クライアント側でデバッグできるように詳細なエラーを返す
            // JSON.stringifyでエラーが起きないように、シンプルなオブジェクトを返す
            return {
                summary: "",
                chapters: [],
                error: `AI分析中にエラーが発生しました: ${error.message || "Unknown error"}`,
                details: error.stack || String(error)
            };
        }
    },
});
