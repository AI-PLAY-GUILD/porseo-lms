import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { auth } from "@clerk/nextjs/server";
import { stepCountIs, streamText, tool } from "ai";
import { z } from "zod";
import { convex } from "@/lib/convex";
import { api } from "../../../../convex/_generated/api";

const SYSTEM_PROMPT = `あなたはPORSEOの学習アシスタントです。ユーザーの学習を支援するAIエージェントです。

## 役割
- ユーザーの質問に基づいて、関連する動画コンテンツを検索・推薦する
- コミュニティの動画一覧を取得して紹介する
- 動画の内容を要約し、どの部分が質問に関連するか説明する
- 学習のアドバイスを提供する

## 利用可能なツール
- **listVideos**: コミュニティの動画一覧を取得する。「どんな動画がある？」「おすすめの動画は？」などの質問に使う
- **searchVideos**: 動画の文字起こしをベクトル検索して、特定のトピックに関連する動画とタイムスタンプを見つける

## 行動規則
1. 「動画一覧」「どんな動画があるか」「おすすめ」などの質問には listVideos ツールを使ってください
2. 特定のトピックや内容を探す場合は searchVideos ツールを使ってください
3. 検索結果がある場合は、以下の形式で回答してください:
   - 関連する動画のタイトルとタイムスタンプ
   - その部分の内容の要約
4. 検索結果がない場合は、一般的な知識で回答し、「該当する動画は見つかりませんでした」と伝えてください
5. 常に日本語で回答してください
6. フレンドリーで丁寧な口調を心がけてください

## 動画リンクのフォーマット
動画を紹介する際は以下の形式を使用してください:
- 動画タイトル: **[タイトル]**
- 概要: [動画の説明または要約]
- 該当箇所（searchVideos使用時のみ）: [開始時間] 〜 [終了時間]

時間は MM:SS 形式で表示してください（例: 3:45）。`;

export async function POST(req: Request) {
    console.log("[chat] STEP 0: リクエスト受信", { method: "POST" });
    try {
        console.log("[chat] STEP 1: 認証開始");
        const { userId } = await auth();
        if (!userId) {
            console.log("[chat] STEP 1 FAIL: userId が存在しません");
            return new Response("Unauthorized", { status: 401 });
        }
        console.log("[chat] STEP 1 OK: 認証成功", { userId });

        // サブスクリプション確認（HTTPクライアントはJWT認証なし → secret認証のServerクエリを使用）
        console.log("[chat] STEP 2: Convexユーザー取得開始", {
            hasSecret: !!process.env.CONVEX_INTERNAL_SECRET,
        });
        const user = await convex.query(api.users.getUserByClerkIdServer, {
            clerkId: userId,
            secret: process.env.CONVEX_INTERNAL_SECRET || "",
        });
        if (!user) {
            console.log("[chat] STEP 2 FAIL: ユーザーが見つかりません", { clerkId: userId });
            return new Response("User not found", { status: 404 });
        }
        console.log("[chat] STEP 2 OK: ユーザー取得成功", {
            userId,
            subscriptionStatus: user.subscriptionStatus,
        });

        console.log("[chat] STEP 3: サブスクリプション確認");
        const activeStatuses = ["active", "trialing", "past_due"];
        if (!activeStatuses.includes(user.subscriptionStatus ?? "")) {
            console.log("[chat] STEP 3 FAIL: サブスクリプションが必要", {
                userId,
                status: user.subscriptionStatus,
            });
            return new Response("Subscription required", { status: 403 });
        }
        console.log("[chat] STEP 3 OK: サブスクリプション有効");

        console.log("[chat] STEP 4: リクエストボディ解析");
        const { messages } = await req.json();
        console.log("[chat] STEP 4 OK: メッセージ取得", {
            userId,
            messageCount: messages?.length,
        });

        console.log("[chat] STEP 5: GEMINI_API_KEY確認", {
            hasKey: !!process.env.GEMINI_API_KEY,
            keyPrefix: process.env.GEMINI_API_KEY?.substring(0, 8),
        });
        if (!process.env.GEMINI_API_KEY) {
            console.error("[chat] STEP 5 FAIL: GEMINI_API_KEY が未設定です");
            return new Response("AI service not configured", { status: 500 });
        }

        const google = createGoogleGenerativeAI({
            apiKey: process.env.GEMINI_API_KEY,
        });
        console.log("[chat] STEP 5 OK: Google AI クライアント作成成功");

        const result = streamText({
            model: google("gemini-3-flash-preview"),
            system: SYSTEM_PROMPT,
            messages,
            tools: {
                listVideos: tool({
                    description:
                        "コミュニティで公開されている動画の一覧を取得します。どんな動画があるか聞かれたときや、おすすめを紹介するときに使います",
                    inputSchema: z.object({
                        keyword: z.string().optional().describe("タイトルや概要を絞り込むキーワード（省略可）"),
                    }),
                    execute: async ({ keyword }) => {
                        try {
                            const videos = await convex.query(api.videos.getPublishedVideos, {});
                            if (!videos || !Array.isArray(videos) || videos.length === 0) {
                                return { videos: [], message: "現在公開されている動画はありません。" };
                            }

                            const list = (videos as Array<Record<string, unknown>>)
                                .filter((v) => {
                                    if (!keyword) return true;
                                    const kw = keyword.toLowerCase();
                                    return (
                                        String(v.title ?? "")
                                            .toLowerCase()
                                            .includes(kw) ||
                                        String(v.description ?? "")
                                            .toLowerCase()
                                            .includes(kw) ||
                                        String(v.summary ?? "")
                                            .toLowerCase()
                                            .includes(kw)
                                    );
                                })
                                .map((v) => ({
                                    videoId: v._id,
                                    title: v.title,
                                    description: v.description ?? null,
                                    summary: v.summary ?? null,
                                    duration: v.duration ?? null,
                                    isLocked: v.isLocked ?? false,
                                }));

                            return { videos: list, total: list.length };
                        } catch (error: unknown) {
                            return {
                                videos: [],
                                error: `動画一覧の取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
                            };
                        }
                    },
                }),
                searchVideos: tool({
                    description:
                        "動画の文字起こしデータをベクトル検索して、ユーザーの質問に関連する動画とタイムスタンプを見つけます",
                    inputSchema: z.object({
                        query: z.string().describe("検索クエリ"),
                        limit: z.number().default(8).describe("返す結果の最大数"),
                    }),
                    execute: async ({ query, limit }) => {
                        const secret = process.env.CONVEX_INTERNAL_SECRET || "";
                        try {
                            const results = await convex.action(api.rag.searchTranscriptions, {
                                query,
                                secret,
                                limit: limit || 8,
                            });
                            if (!results || !Array.isArray(results) || results.length === 0) {
                                return {
                                    results: [] as Array<Record<string, unknown>>,
                                    message: "関連する動画が見つかりませんでした。",
                                };
                            }
                            return {
                                results: (results as unknown as Array<Record<string, unknown>>).map(
                                    (r: Record<string, unknown>) => ({
                                        videoTitle: r.videoTitle,
                                        videoId: r.videoId,
                                        muxPlaybackId: r.muxPlaybackId,
                                        text: r.text,
                                        startTime: Math.floor(r.startTime as number),
                                        endTime: Math.floor(r.endTime as number),
                                        relevanceScore: r.score,
                                    }),
                                ),
                            };
                        } catch (error: unknown) {
                            console.error("Video search error:", error);
                            return {
                                results: [] as Array<Record<string, unknown>>,
                                error: `検索エラー: ${error instanceof Error ? error.message : String(error)}`,
                            };
                        }
                    },
                }),
            },
            stopWhen: stepCountIs(5),
        });

        console.log("[chat] STEP 6 OK: streamText呼び出し成功、ストリームレスポンス送信", { userId });
        return result.toUIMessageStreamResponse();
    } catch (error: unknown) {
        console.error("[chat] エラー:", error);
        const detail = error instanceof Error ? error.message : String(error);
        const stack = error instanceof Error ? error.stack : undefined;
        console.error("[chat] エラー詳細:", { detail, stack });
        return new Response(JSON.stringify({ error: "Internal server error", detail }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
