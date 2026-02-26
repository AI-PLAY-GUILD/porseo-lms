"use node";

import { GoogleGenAI } from "@google/genai";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, internalAction } from "./_generated/server";
import { safeCompare } from "./lib/safeCompare";

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 100;
const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 1536;

// ============================
// VTT → テキストチャンク分割
// ============================
interface VttSegment {
    startTime: number;
    endTime: number;
    text: string;
}

function parseVtt(vttText: string): VttSegment[] {
    const segments: VttSegment[] = [];
    const lines = vttText.split("\n");
    let i = 0;

    while (i < lines.length) {
        const line = lines[i].trim();
        const timeMatch = line.match(/(\d{1,2}:?\d{2}:\d{2}[.,]\d{3})\s*-->\s*(\d{1,2}:?\d{2}:\d{2}[.,]\d{3})/);
        if (timeMatch) {
            const startTime = parseTimestamp(timeMatch[1]);
            const endTime = parseTimestamp(timeMatch[2]);
            const textLines: string[] = [];
            i++;
            while (i < lines.length && lines[i].trim() !== "") {
                textLines.push(lines[i].trim());
                i++;
            }
            const text = textLines.join(" ").trim();
            if (text) {
                segments.push({ startTime, endTime, text });
            }
        }
        i++;
    }
    return segments;
}

function parseTimestamp(ts: string): number {
    const cleaned = ts.replace(",", ".");
    const parts = cleaned.split(":");
    if (parts.length === 3) {
        return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
    }
    if (parts.length === 2) {
        return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
    }
    return 0;
}

interface TextChunk {
    text: string;
    startTime: number;
    endTime: number;
}

function createChunks(segments: VttSegment[]): TextChunk[] {
    if (segments.length === 0) return [];

    const chunks: TextChunk[] = [];
    let currentText = "";
    let chunkStartTime = segments[0].startTime;
    let chunkEndTime = segments[0].endTime;

    for (const seg of segments) {
        if (currentText.length + seg.text.length > CHUNK_SIZE && currentText.length > 0) {
            chunks.push({
                text: currentText.trim(),
                startTime: chunkStartTime,
                endTime: chunkEndTime,
            });
            const overlap = currentText.slice(-CHUNK_OVERLAP);
            currentText = `${overlap} ${seg.text}`;
            chunkStartTime = seg.startTime;
        } else {
            currentText += ` ${seg.text}`;
        }
        chunkEndTime = seg.endTime;
    }

    if (currentText.trim()) {
        chunks.push({
            text: currentText.trim(),
            startTime: chunkStartTime,
            endTime: chunkEndTime,
        });
    }

    return chunks;
}

function createPlainTextChunks(text: string): TextChunk[] {
    const chunks: TextChunk[] = [];
    for (let i = 0; i < text.length; i += CHUNK_SIZE - CHUNK_OVERLAP) {
        chunks.push({
            text: text.slice(i, i + CHUNK_SIZE),
            startTime: 0,
            endTime: 0,
        });
    }
    return chunks;
}

// ============================
// エンベディング生成
// ============================
async function generateEmbeddings(client: GoogleGenAI, texts: string[]): Promise<number[][]> {
    const allEmbeddings: number[][] = [];
    const batchSize = 10;
    for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const results = await Promise.all(
            batch.map(async (text: string): Promise<number[]> => {
                const response = await client.models.embedContent({
                    model: EMBEDDING_MODEL,
                    contents: text,
                    config: { outputDimensionality: EMBEDDING_DIMENSIONS },
                });
                return response.embeddings?.[0]?.values || [];
            }),
        );
        allEmbeddings.push(...results);
    }
    return allEmbeddings;
}

// ============================
// 動画の文字起こしをインデックス化 (管理者用)
// ============================
export const indexVideoTranscription = action({
    args: {
        videoId: v.id("videos"),
    },
    handler: async (ctx, args): Promise<{ chunksCreated: number }> => {
        console.log("[rag:indexVideoTranscription] 開始", { videoId: args.videoId });
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            console.log("[rag:indexVideoTranscription] 未認証ユーザー");
            throw new Error("Unauthorized: Authentication required");
        }

        const user = await ctx.runQuery(api.users.getUserByClerkIdQuery, {
            clerkId: identity.subject,
        });
        if (!user?.isAdmin) {
            console.log("[rag:indexVideoTranscription] 管理者権限なし");
            throw new Error("Unauthorized: Admin access required");
        }

        const video = await ctx.runQuery(api.videos.getById, { videoId: args.videoId });
        if (!video) {
            console.log("[rag:indexVideoTranscription] 動画未検出", { videoId: args.videoId });
            throw new Error("Video not found");
        }
        if (!video.transcription) {
            console.log("[rag:indexVideoTranscription] 文字起こしデータなし", { videoId: args.videoId });
            throw new Error("文字起こしデータがありません");
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("[rag:indexVideoTranscription] GEMINI_API_KEY未設定");
            throw new Error("GEMINI_API_KEY is not set");
        }
        const client = new GoogleGenAI({ apiKey });

        console.log("[rag:indexVideoTranscription] 既存チャンク削除開始");
        await ctx.runMutation(internal.ragDb.deleteChunksByVideoId, {
            videoId: args.videoId,
        });

        const transcription: string = video.transcription;
        const isVtt: boolean = transcription.includes("-->") || transcription.startsWith("WEBVTT");
        const chunks: TextChunk[] = isVtt
            ? createChunks(parseVtt(transcription))
            : createPlainTextChunks(transcription);

        if (chunks.length === 0) {
            console.log("[rag:indexVideoTranscription] チャンク生成失敗");
            throw new Error("チャンクの生成に失敗しました");
        }
        console.log("[rag:indexVideoTranscription] チャンク生成完了", { chunksCount: chunks.length, isVtt });

        const texts: string[] = chunks.map((c: TextChunk) => c.text);
        console.log("[rag:indexVideoTranscription] エンベディング生成開始", { textsCount: texts.length });
        const embeddings = await generateEmbeddings(client, texts);

        const dbChunks = chunks.map((chunk: TextChunk, i: number) => ({
            videoId: args.videoId,
            text: chunk.text,
            startTime: chunk.startTime,
            endTime: chunk.endTime,
            embedding: embeddings[i],
        }));

        console.log("[rag:indexVideoTranscription] チャンクDB保存開始", { dbChunksCount: dbChunks.length });
        const saveBatchSize = 50;
        for (let i = 0; i < dbChunks.length; i += saveBatchSize) {
            await ctx.runMutation(internal.ragDb.saveChunks, {
                chunks: dbChunks.slice(i, i + saveBatchSize),
            });
        }

        console.log("[rag:indexVideoTranscription] 完了", { videoId: args.videoId, chunksCreated: chunks.length });
        return { chunksCreated: chunks.length };
    },
});

// ============================
// 自動インデックス化 (サーバーサイドスケジューラから呼び出し用・認証不要)
// ============================
export const autoIndexVideoTranscription = internalAction({
    args: {
        videoId: v.id("videos"),
    },
    handler: async (ctx, args): Promise<void> => {
        console.log("[rag:autoIndexVideoTranscription] 開始", { videoId: args.videoId });
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("[autoIndex] GEMINI_API_KEY is not set");
            return;
        }

        const video = await ctx.runQuery(api.videos.getById, { videoId: args.videoId });
        if (!video?.transcription) {
            console.log("[autoIndex] No transcription found for video:", args.videoId);
            return;
        }

        try {
            const client = new GoogleGenAI({ apiKey });

            await ctx.runMutation(internal.ragDb.deleteChunksByVideoId, {
                videoId: args.videoId,
            });

            const transcription: string = video.transcription;
            const isVtt: boolean = transcription.includes("-->") || transcription.startsWith("WEBVTT");
            const chunks: TextChunk[] = isVtt
                ? createChunks(parseVtt(transcription))
                : createPlainTextChunks(transcription);

            if (chunks.length === 0) {
                console.warn("[autoIndex] No chunks generated for video:", args.videoId);
                return;
            }

            const texts: string[] = chunks.map((c: TextChunk) => c.text);
            const embeddings = await generateEmbeddings(client, texts);

            const dbChunks = chunks.map((chunk: TextChunk, i: number) => ({
                videoId: args.videoId,
                text: chunk.text,
                startTime: chunk.startTime,
                endTime: chunk.endTime,
                embedding: embeddings[i],
            }));

            const saveBatchSize = 50;
            for (let i = 0; i < dbChunks.length; i += saveBatchSize) {
                await ctx.runMutation(internal.ragDb.saveChunks, {
                    chunks: dbChunks.slice(i, i + saveBatchSize),
                });
            }

            console.log(`[autoIndex] Indexed ${chunks.length} chunks for video:`, args.videoId);
        } catch (error) {
            console.error("[autoIndex] Failed to index video:", args.videoId, error);
        }
    },
});

// ============================
// ベクトル検索 (API Route から呼び出し用)
// ============================
interface SearchResult {
    videoId: Id<"videos">;
    videoTitle: string;
    muxPlaybackId: string | null;
    text: string;
    startTime: number;
    endTime: number;
    score: number;
}

export const searchTranscriptions = action({
    args: {
        query: v.string(),
        secret: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args): Promise<SearchResult[]> => {
        console.log("[rag:searchTranscriptions] 開始", { query: args.query, limit: args.limit });
        if (!safeCompare(args.secret, process.env.CONVEX_INTERNAL_SECRET || "")) {
            console.log("[rag:searchTranscriptions] 認証失敗: 無効なsecret");
            throw new Error("Unauthorized: Invalid secret");
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("[rag:searchTranscriptions] GEMINI_API_KEY未設定");
            throw new Error("GEMINI_API_KEY is not set");
        }
        const client = new GoogleGenAI({ apiKey });

        console.log("[rag:searchTranscriptions] クエリエンベディング生成開始");
        const response = await client.models.embedContent({
            model: EMBEDDING_MODEL,
            contents: args.query,
            config: { outputDimensionality: EMBEDDING_DIMENSIONS },
        });
        const queryEmbedding = response.embeddings?.[0]?.values;
        if (!queryEmbedding) {
            console.error("[rag:searchTranscriptions] クエリエンベディング生成失敗");
            throw new Error("Failed to generate query embedding");
        }

        const results = await ctx.vectorSearch("transcription_chunks", "by_embedding", {
            vector: queryEmbedding,
            limit: args.limit || 10,
        });

        const enrichedResults: (SearchResult | null)[] = await Promise.all(
            results.map(async (result): Promise<SearchResult | null> => {
                const chunk = await ctx.runQuery(api.ragDb.getChunk, { id: result._id });
                if (!chunk) return null;
                const video = await ctx.runQuery(api.videos.getById, { videoId: chunk.videoId });
                return {
                    videoId: chunk.videoId,
                    videoTitle: video?.title || "Unknown",
                    muxPlaybackId: video?.muxPlaybackId || null,
                    text: chunk.text,
                    startTime: chunk.startTime,
                    endTime: chunk.endTime,
                    score: result._score,
                };
            }),
        );

        const finalResults = enrichedResults.filter((r): r is SearchResult => r !== null);
        console.log("[rag:searchTranscriptions] 完了", { query: args.query, resultsCount: finalResults.length });
        return finalResults;
    },
});
