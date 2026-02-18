import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { ConvexHttpClient } from "convex/browser";

const convexUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;

export const searchVideos = createTool({
    id: "search-videos",
    description:
        "動画の文字起こしデータをベクトル検索して、ユーザーの質問に関連する動画とタイムスタンプを見つけます。学習内容、トピック、キーワードで検索できます。",
    inputSchema: z.object({
        query: z
            .string()
            .describe("検索クエリ。ユーザーが知りたいトピックや質問内容"),
        limit: z
            .number()
            .optional()
            .default(8)
            .describe("返す結果の最大数 (デフォルト: 8)"),
    }),
    execute: async (inputData) => {
        if (!convexUrl) {
            return { results: [], error: "Convex URL not configured" };
        }

        const client = new ConvexHttpClient(convexUrl);
        const secret = process.env.CONVEX_INTERNAL_SECRET || "";

        try {
            const results = await client.action(
                "rag:searchTranscriptions" as any,
                {
                    query: inputData.query,
                    secret,
                    limit: inputData.limit || 8,
                }
            );

            if (!results || results.length === 0) {
                return {
                    results: [],
                    message: "関連する動画が見つかりませんでした。",
                };
            }

            return {
                results: results.map((r: any) => ({
                    videoTitle: r.videoTitle,
                    videoId: r.videoId,
                    muxPlaybackId: r.muxPlaybackId,
                    text: r.text,
                    startTime: Math.floor(r.startTime),
                    endTime: Math.floor(r.endTime),
                    relevanceScore: r.score,
                })),
            };
        } catch (error: any) {
            console.error("Video search error:", error);
            return {
                results: [],
                error: `検索中にエラーが発生しました: ${error.message}`,
            };
        }
    },
});
