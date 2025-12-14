"use node";

import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { GoogleGenerativeAI } from "@google/generative-ai";

// VTTパース用のヘルパー関数
function parseVTT(vttText: string) {
    const lines = vttText.split('\n');
    const segments: { start: number; end: number; text: string }[] = [];

    let currentStart = 0;
    let currentEnd = 0;
    let currentText = "";

    // 簡易的なVTTパーサー
    // 00:00:00.000 --> 00:00:05.000 のような行を探す
    const timeRegex = /(\d{2}):(\d{2}):(\d{2})\.(\d{3}) --> (\d{2}):(\d{2}):(\d{2})\.(\d{3})/;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === "WEBVTT" || line === "") continue;

        const match = line.match(timeRegex);
        if (match) {
            // 前のセグメントを保存
            if (currentText) {
                segments.push({ start: currentStart, end: currentEnd, text: currentText.trim() });
            }

            // 時間をパース (秒単位)
            const startSeconds = parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3]) + parseInt(match[4]) / 1000;
            const endSeconds = parseInt(match[5]) * 3600 + parseInt(match[6]) * 60 + parseInt(match[7]) + parseInt(match[8]) / 1000;

            currentStart = startSeconds;
            currentEnd = endSeconds;
            currentText = "";
        } else {
            // テキストを追加
            currentText += line + " ";
        }
    }
    // 最後のセグメント
    if (currentText) {
        segments.push({ start: currentStart, end: currentEnd, text: currentText.trim() });
    }

    return segments;
}

// チャンク分割 (一定の文字数でまとめる)
function chunkSegments(segments: { start: number; end: number; text: string }[], maxChars = 1000) {
    const chunks: { start: number; end: number; text: string }[] = [];
    let currentChunkText = "";
    let currentChunkStart = segments[0]?.start || 0;
    let currentChunkEnd = segments[0]?.end || 0;

    for (const seg of segments) {
        if (currentChunkText.length + seg.text.length > maxChars) {
            chunks.push({
                start: currentChunkStart,
                end: currentChunkEnd,
                text: currentChunkText.trim()
            });
            currentChunkText = "";
            currentChunkStart = seg.start;
        }
        currentChunkText += seg.text + " ";
        currentChunkEnd = seg.end;
    }
    if (currentChunkText) {
        chunks.push({
            start: currentChunkStart,
            end: currentChunkEnd,
            text: currentChunkText.trim()
        });
    }
    return chunks;
}

export const ingest = action({
    args: { videoId: v.id("videos") },
    handler: async (ctx, args) => {
        const video = await ctx.runQuery(api.videos.getById, { videoId: args.videoId });
        if (!video || !video.transcription) {
            throw new Error("Video or transcription not found");
        }

        console.log(`Starting ingestion for video: ${video.title}`);

        // 1. VTTパース & チャンク分割
        const segments = parseVTT(video.transcription);
        const chunks = chunkSegments(segments);
        console.log(`Generated ${chunks.length} chunks`);

        // 2. Embedding生成
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

        // 既存のチャンクを削除 (再インデックス時)
        // Note: actionからはmutationを直接呼べないので、internalMutation経由で呼ぶ必要があるが、
        // ここでは簡易的に、呼び出し元で削除してもらうか、追記のみとする。
        // 今回はシンプルに「追加」のみ実装し、重複削除は別途考慮する。

        // バッチ処理でEmbedding生成と保存
        const batchSize = 10;
        for (let i = 0; i < chunks.length; i += batchSize) {
            const batch = chunks.slice(i, i + batchSize);

            const promises = batch.map(async (chunk) => {
                const result = await model.embedContent(chunk.text);
                const embedding = result.embedding.values;
                return {
                    videoId: args.videoId,
                    text: chunk.text,
                    startTime: chunk.start,
                    endTime: chunk.end,
                    embedding: embedding,
                };
            });

            const chunkData = await Promise.all(promises);

            // DBに保存 (internalMutationを呼ぶ)
            await ctx.runMutation(internal.ragDb.saveChunks, { chunks: chunkData });
            console.log(`Processed batch ${i / batchSize + 1}`);
        }

        console.log("Ingestion complete");
    },
});

import { Doc } from "./_generated/dataModel";

export const search = action({
    args: { query: v.string() },
    handler: async (ctx, args): Promise<(Doc<"transcription_chunks"> & { score: number })[]> => {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

        // クエリのEmbedding生成
        const result = await model.embedContent(args.query);
        const embedding = result.embedding.values;

        // ベクトル検索
        const searchResults = await ctx.vectorSearch("transcription_chunks", "by_embedding", {
            vector: embedding,
            limit: 5,
        });

        // 結果の詳細を取得
        const results = await Promise.all(searchResults.map(async (r) => {
            const chunk = await ctx.runQuery(api.ragDb.getChunk, { id: r._id });
            if (!chunk) throw new Error("Chunk not found");
            return { ...chunk, score: r._score };
        }));

        return results;
    },
});

export const chat = action({
    args: {
        videoId: v.id("videos"),
        messages: v.array(v.object({ role: v.string(), content: v.string() })),
    },
    handler: async (ctx, args) => {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
        const genAI = new GoogleGenerativeAI(apiKey);
        const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

        const lastMessage = args.messages[args.messages.length - 1];
        if (!lastMessage || lastMessage.role !== "user") {
            throw new Error("Last message must be from user");
        }

        console.log(`Chat query: ${lastMessage.content}`);

        // 1. クエリのEmbedding生成
        const embeddingResult = await embeddingModel.embedContent(lastMessage.content);
        const embedding = embeddingResult.embedding.values;

        // 2. ベクトル検索 (現在の動画に限定)
        const searchResults = await ctx.vectorSearch("transcription_chunks", "by_embedding", {
            vector: embedding,
            limit: 5,
            filter: (q) => q.eq("videoId", args.videoId),
        });

        // 3. コンテキスト取得
        const contextChunks = await Promise.all(searchResults.map(async (r) => {
            const chunk = await ctx.runQuery(api.ragDb.getChunk, { id: r._id });
            return chunk;
        }));

        const contextText = contextChunks
            .filter(c => c !== null)
            .map(c => `[${formatTime(c!.startTime)} - ${formatTime(c!.endTime)}] ${c!.text}`)
            .join("\n\n");

        // 4. プロンプト構築
        const systemPrompt = `
あなたは動画学習プラットフォームのAIアシスタントです。
以下の「動画の文字起こし（コンテキスト）」に基づいて、ユーザーの質問に答えてください。

# ルール
- コンテキストにある情報のみを使って答えてください。
- 答えには、必ず情報の根拠となる「タイムスタンプ」を含めてください。形式: [MM:SS]
- タイムスタンプは、ユーザーがクリックして動画のその場所に飛べるようにするために重要です。
- コンテキストに答えがない場合は、「申し訳ありませんが、動画の中にその情報は見つかりませんでした」と答えてください。
- 親しみやすく、かつ教育的なトーンで話してください。

# コンテキスト
${contextText}
`;

        // 5. Gemini呼び出し
        // systemInstructionを使ってモデルを初期化
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: systemPrompt,
        });

        const chat = model.startChat({
            history: args.messages.slice(0, -1).map(m => ({
                role: m.role === "user" ? "user" : "model",
                parts: [{ text: m.content }],
            })),
            generationConfig: {
                maxOutputTokens: 1000,
                temperature: 0.7,
            },
        });

        const result = await chat.sendMessage(lastMessage.content);
        const response = result.response.text();
        console.log("Gemini Chat Response:", response);

        return response;
    },
});

function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
