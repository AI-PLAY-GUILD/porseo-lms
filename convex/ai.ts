"use node";

import { ActionCtx, action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { GoogleGenAI } from "@google/genai";
// Muxは使っていないため削除

export const generateVideoMetadata = action({
    args: {
        videoId: v.id("videos"),
        muxAssetId: v.optional(v.string()),
        transcription: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // --- Security Check Start ---
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized: Authentication required");
        }

        const user = await ctx.runQuery(api.users.getUserByClerkIdQuery, {
            clerkId: identity.subject,
        });

        if (!user || !user.isAdmin) {
            throw new Error("Unauthorized: Admin access required");
        }
        // --- Security Check End ---

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

            // テキストが空の場合のチェックを強化
            if (!subtitleText || subtitleText.trim().length === 0) {
                console.warn("No transcription found for video:", args.videoId);
                throw new Error("文字起こしテキストがありません。");
            }

            console.log("Using transcription text length:", subtitleText.length);

            // 2. Geminiで分析
            const client = new GoogleGenAI({ apiKey: apiKey });

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
${subtitleText}
`;

            // モデル名を具体的に指定 (gemini-1.5-flash)
            const response = await client.models.generateContent({
                model: "gemini-1.5-flash",
                contents: [
                    {
                        role: "user",
                        parts: [
                            { text: prompt }
                        ]
                    }
                ],
                config: {
                    responseMimeType: "application/json",
                },
            });

            let responseText = "";

            // 3. レスポンスの取得 (修正ポイント: 関数として呼び出す)
            const textOrFunc = (response as any).text;
            if (typeof textOrFunc === 'function') {
                responseText = textOrFunc();
            } else if (textOrFunc) {
                // プロパティの場合のフォールバック
                responseText = textOrFunc as string;
            } else if (response.candidates && response.candidates.length > 0) {
                // candidatesからの取得フォールバック
                const candidate = response.candidates[0];
                if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                    responseText = candidate.content.parts[0].text || "";
                }
            }

            if (!responseText) {
                console.error("Empty response from Gemini:", JSON.stringify(response, null, 2));
                throw new Error("AIからの応答が空でした。");
            }

            // 余計なMarkdown記法が含まれていた場合のクリーニング（念のため）
            responseText = responseText.replace(/^```json\s*/, "").replace(/\s*```$/, "");

            console.log("Gemini Response:", responseText);

            // JSONパース
            let aiData;
            try {
                aiData = JSON.parse(responseText);
            } catch (e) {
                console.log("JSON Parse failed, trying regex extraction...");
                // JSONオブジェクト部分だけを抽出する正規表現
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    try {
                        aiData = JSON.parse(jsonMatch[0]);
                    } catch (e2) {
                        throw new Error("AIからの応答をJSONとして解析できませんでした。");
                    }
                } else {
                    throw new Error("AIからの応答に有効なJSONが含まれていませんでした。");
                }
            }

            // 4. DB更新
            await ctx.runMutation(internal.videos.updateVideoAiMetadata, {
                videoId: args.videoId,
                summary: aiData.summary,
                chapters: aiData.chapters,
            });

            return aiData;

        } catch (error: any) {
            console.error("Gemini API Error:", error);
            // エラー時もJSON構造を保って返す
            return {
                summary: "",
                chapters: [],
                error: `AI分析中にエラーが発生しました: ${error.message || "Unknown error"}`,
            };
        }
    },
});
