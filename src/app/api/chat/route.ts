import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { auth } from "@clerk/nextjs/server";
import { convertToModelMessages, stepCountIs, streamText, tool } from "ai";
import { z } from "zod";
import { convex } from "@/lib/convex";
import { api } from "../../../../convex/_generated/api";

const SYSTEM_PROMPT = `あなたはPORSEOの学習アシスタントです。

## ツール
- **listVideos**: 動画一覧を取得（「どんな動画がある？」「おすすめは？」で使用）
- **searchVideos**: 文字起こしをベクトル検索（特定トピックの検索に使用）

## 回答ルール
- 常に日本語で、フレンドリーに回答
- **簡潔に要点をまとめる**（長文は避ける）
- 動画は最大3つまで紹介（多すぎると読みにくい）
- 検索結果がない場合は一般知識で回答し「該当する動画は見つかりませんでした」と伝える

## マークダウン記法（必ず使用すること）
回答には以下のマークダウンを積極的に使ってください：

- 見出しで区切る: \`### セクション名\`
- 箇条書きリスト: \`- 項目\`
- 番号付きリスト: \`1. 項目\`
- 太字で強調: \`**重要な部分**\`
- 段落間に空行を入れる

## 動画の紹介フォーマット
動画を紹介する際は必ず以下の形式で：

### 📺 動画タイトル
**概要**: 1〜2文の説明

該当箇所がある場合: **⏱ 0:00 〜 0:00**

---

（動画ごとに区切り線 \`---\` を入れる）`;

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
            secretLength: process.env.CONVEX_INTERNAL_SECRET?.length,
            convexUrl: process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL,
        });
        // biome-ignore lint: Convex型は動的生成のため明示的な型定義が困難
        let user: any;
        try {
            user = await convex.query(api.users.getUserByClerkIdServer, {
                clerkId: userId,
                secret: process.env.CONVEX_INTERNAL_SECRET || "",
            });
        } catch (convexError: unknown) {
            const msg = convexError instanceof Error ? convexError.message : String(convexError);
            console.error("[chat] STEP 2 ERROR: Convexクエリ失敗", { error: msg });
            return new Response(
                JSON.stringify({
                    error: "Convex query failed",
                    detail: msg,
                    hint: "CONVEX_INTERNAL_SECRET がVercelとConvexで一致しているか確認してください",
                }),
                { status: 500, headers: { "Content-Type": "application/json" } },
            );
        }
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
        const { messages: uiMessages } = await req.json();
        const messages = await convertToModelMessages(uiMessages);
        console.log("[chat] STEP 4 OK: メッセージ取得・変換完了", {
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
