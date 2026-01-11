"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { GoogleGenerativeAI } from "@google/generative-ai";
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

        // 2. Geminiで分析
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-3-pro",
            generationConfig: { responseMimeType: "application/json" } // JSON出力を強制
        });

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

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        console.log("Gemini Response:", responseText);

        // JSONパース
        let aiData;
        try {
            // responseMimeType: "application/json" を指定していても、念のため抽出処理を入れる
            // ただし、今回は単純にパースを試みる
            aiData = JSON.parse(responseText);
        } catch (e) {
            console.log("JSON Parse failed, trying regex extraction...");
            // フォールバック: 最初の { から 最後の } までではなく、
            // 最初の { から、対応する } までを探す簡易ロジック、または単純に最初の { から最後の } まで
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
    },
});
