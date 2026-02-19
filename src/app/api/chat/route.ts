import { streamText, stepCountIs, tool } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { convex } from "@/lib/convex";

const SYSTEM_PROMPT = `あなたはPORSEOの学習アシスタントです。ユーザーの学習を支援するAIエージェントです。

## 役割
- ユーザーの質問に基づいて、関連する動画コンテンツを検索・推薦する
- 動画の内容を要約し、どの部分が質問に関連するか説明する
- 学習のアドバイスを提供する

## 行動規則
1. ユーザーの質問を受けたら、まず searchVideos ツールを使って関連動画を検索してください
2. 検索結果がある場合は、以下の形式で回答してください:
   - 関連する動画のタイトルとタイムスタンプ
   - その部分の内容の要約
3. 検索結果がない場合は、一般的な知識で回答し、「該当する動画は見つかりませんでした」と伝えてください
4. 常に日本語で回答してください
5. フレンドリーで丁寧な口調を心がけてください

## 動画リンクのフォーマット
動画を紹介する際は以下の形式を使用してください:
- 動画タイトル: **[タイトル]**
- 該当箇所: [開始時間] 〜 [終了時間]
- 内容: [その部分の要約]

時間は MM:SS 形式で表示してください（例: 3:45）。`;

export async function POST(req: Request) {
    const { userId } = await auth();
    if (!userId) {
        return new Response("Unauthorized", { status: 401 });
    }

    // サブスクリプション確認
    const user = await convex.query("users:getUserByClerkIdQuery" as any, {
        clerkId: userId,
    });
    if (!user) {
        return new Response("User not found", { status: 404 });
    }
    const activeStatuses = ["active", "trialing"];
    if (!activeStatuses.includes(user.subscriptionStatus ?? "")) {
        return new Response("Subscription required", { status: 403 });
    }

    const { messages } = await req.json();

    const result = streamText({
        model: google("gemini-3.0-flash"),
        system: SYSTEM_PROMPT,
        messages,
        tools: {
            searchVideos: tool({
                description:
                    "動画の文字起こしデータをベクトル検索して、ユーザーの質問に関連する動画とタイムスタンプを見つけます",
                inputSchema: z.object({
                    query: z.string().describe("検索クエリ"),
                    limit: z
                        .number()
                        .default(8)
                        .describe("返す結果の最大数"),
                }),
                execute: async ({ query, limit }) => {
                    const secret =
                        process.env.CONVEX_INTERNAL_SECRET || "";
                    try {
                        const results = await convex.action(
                            "rag:searchTranscriptions" as any,
                            { query, secret, limit: limit || 8 }
                        );
                        if (!results || (results as any[]).length === 0) {
                            return {
                                results: [] as any[],
                                message:
                                    "関連する動画が見つかりませんでした。",
                            };
                        }
                        return {
                            results: (results as any[]).map((r: any) => ({
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
                            results: [] as any[],
                            error: `検索エラー: ${error.message}`,
                        };
                    }
                },
            }),
        },
        stopWhen: stepCountIs(3),
    });

    return result.toUIMessageStreamResponse();
}
