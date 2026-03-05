"use node";

import { GoogleGenAI } from "@google/genai";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, internalAction } from "./_generated/server";
// Muxは使っていないため削除

export const generateVideoMetadata = action({
    args: {
        videoId: v.id("videos"),
        muxAssetId: v.optional(v.string()),
        transcription: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        console.log("[ai:generateVideoMetadata] 開始", {
            videoId: args.videoId,
            hasMuxAssetId: !!args.muxAssetId,
            hasTranscription: !!args.transcription,
        });
        // --- Security Check Start ---
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            console.log("[ai:generateVideoMetadata] 未認証ユーザー");
            throw new Error("Unauthorized: Authentication required");
        }

        const user = await ctx.runQuery(api.users.getUserByClerkIdQuery, {
            clerkId: identity.subject,
        });

        if (!user || !user.isAdmin) {
            console.log("[ai:generateVideoMetadata] 管理者権限なし");
            throw new Error("Unauthorized: Admin access required");
        }
        // --- Security Check End ---

        try {
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
                console.error("[ai:generateVideoMetadata] GEMINI_API_KEY未設定");
                throw new Error("GEMINI_API_KEY is not set");
            }

            // 1. 文字起こしテキストの取得
            let subtitleText = args.transcription || "";

            if (!subtitleText) {
                const video = await ctx.runQuery(api.videos.getById, { videoId: args.videoId });
                if (video?.transcription) {
                    subtitleText = video.transcription;
                }
            }

            // テキストが空の場合のチェックを強化
            if (!subtitleText || subtitleText.trim().length === 0) {
                console.log("[ai:generateVideoMetadata] 文字起こしテキストなし");
                throw new Error("文字起こしテキストがありません。");
            }

            console.log("[ai:generateVideoMetadata] Gemini API呼び出し開始", { textLength: subtitleText.length });

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
                        parts: [{ text: prompt }],
                    },
                ],
                config: {
                    responseMimeType: "application/json",
                },
            });

            let responseText = "";

            // 3. レスポンスの取得 (修正ポイント: 関数として呼び出す)
            const textOrFunc = (response as unknown as Record<string, unknown>).text;
            if (typeof textOrFunc === "function") {
                responseText = textOrFunc();
            } else if (textOrFunc) {
                // プロパティの場合のフォールバック
                responseText = textOrFunc as string;
            } else if (response.candidates && response.candidates.length > 0) {
                // candidatesからの取得フォールバック
                const candidate = response.candidates[0];
                if (candidate.content?.parts && candidate.content.parts.length > 0) {
                    responseText = candidate.content.parts[0].text || "";
                }
            }

            if (!responseText) {
                console.error("Empty response from Gemini:", JSON.stringify(response, null, 2));
                throw new Error("AIからの応答が空でした。");
            }

            // 余計なMarkdown記法が含まれていた場合のクリーニング（念のため）
            responseText = responseText.replace(/^```json\s*/, "").replace(/\s*```$/, "");

            // JSONパース
            let aiData: { summary: string; chapters: { startTime: number; title: string; description: string }[] };
            try {
                aiData = JSON.parse(responseText);
            } catch (_e) {
                // JSONオブジェクト部分だけを抽出する正規表現
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    try {
                        aiData = JSON.parse(jsonMatch[0]);
                    } catch (_e2) {
                        throw new Error("AIからの応答をJSONとして解析できませんでした。");
                    }
                } else {
                    throw new Error("AIからの応答に有効なJSONが含まれていませんでした。");
                }
            }

            // 4. DB更新
            console.log("[ai:generateVideoMetadata] DB更新開始", { chaptersCount: aiData.chapters?.length });
            await ctx.runMutation(internal.videos.updateVideoAiMetadata, {
                videoId: args.videoId,
                summary: aiData.summary,
                chapters: aiData.chapters,
            });

            console.log("[ai:generateVideoMetadata] 完了", {
                videoId: args.videoId,
                chaptersCount: aiData.chapters?.length,
            });
            return aiData;
        } catch (error: unknown) {
            console.error("[ai:generateVideoMetadata] エラー:", error);
            // エラー時もJSON構造を保って返す
            return {
                summary: "",
                chapters: [],
                error: `AI分析中にエラーが発生しました: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
        }
    },
});

export const generateVideoDescription = action({
    args: {
        videoId: v.id("videos"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized: Authentication required");

        const user = await ctx.runQuery(api.users.getUserByClerkIdQuery, {
            clerkId: identity.subject,
        });
        if (!user || !user.isAdmin) throw new Error("Unauthorized: Admin access required");

        const video = await ctx.runQuery(api.videos.getById, { videoId: args.videoId });
        if (!video) throw new Error("Video not found");

        const subtitleText = video.transcription;
        if (!subtitleText || subtitleText.trim().length === 0) {
            throw new Error("文字起こしテキストがありません。");
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

        const client = new GoogleGenAI({ apiKey });

        const prompt = `
あなたは教育動画のプロフェッショナルな編集者です。
以下の動画の文字起こしテキストを分析し、「動画について」セクションに表示する説明文を作成してください。

# ルール
- 動画の内容を簡潔に紹介する説明文を2〜4文で作成
- 学習者が「この動画を見るべきか」判断できる内容にする
- 動画で扱っている主要なトピックやテーマを含める
- 固い表現は避け、分かりやすい日本語で書く
- 「この動画では〜」で始めてください

# 動画タイトル
${video.title}

# 文字起こしデータ
${subtitleText.slice(0, 15000)}
`;

        const response = await client.models.generateContent({
            model: "gemini-1.5-flash",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        let description = "";
        const textOrFunc = (response as unknown as Record<string, unknown>).text;
        if (typeof textOrFunc === "function") {
            description = textOrFunc();
        } else if (textOrFunc) {
            description = textOrFunc as string;
        } else if (response.candidates && response.candidates.length > 0) {
            const candidate = response.candidates[0];
            if (candidate.content?.parts && candidate.content.parts.length > 0) {
                description = candidate.content.parts[0].text || "";
            }
        }

        if (!description) throw new Error("AIからの応答が空でした。");

        description = description.trim();

        await ctx.runMutation(internal.videos.updateVideoDescription, {
            videoId: args.videoId,
            description,
        });

        return { description };
    },
});

export const batchGenerateDescriptions = internalAction({
    args: {},
    handler: async (ctx) => {
        const videos = await ctx.runQuery(internal.videos.getAllVideosInternal);

        let updated = 0;
        let skipped = 0;
        let failed = 0;

        for (const video of videos) {
            if (!video.transcription || video.transcription.trim().length === 0) {
                skipped++;
                continue;
            }

            try {
                const apiKey = process.env.GEMINI_API_KEY;
                if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

                const client = new GoogleGenAI({ apiKey });

                const prompt = `
あなたは教育動画のプロフェッショナルな編集者です。
以下の動画の文字起こしテキストを分析し、「動画について」セクションに表示する説明文を作成してください。

# ルール
- 動画の内容を簡潔に紹介する説明文を2〜4文で作成
- 学習者が「この動画を見るべきか」判断できる内容にする
- 動画で扱っている主要なトピックやテーマを含める
- 固い表現は避け、分かりやすい日本語で書く
- 「この動画では〜」で始めてください

# 動画タイトル
${video.title}

# 文字起こしデータ
${video.transcription.slice(0, 15000)}
`;

                const response = await client.models.generateContent({
                    model: "gemini-1.5-flash",
                    contents: [{ role: "user", parts: [{ text: prompt }] }],
                });

                let description = "";
                const textOrFunc = (response as unknown as Record<string, unknown>).text;
                if (typeof textOrFunc === "function") {
                    description = textOrFunc();
                } else if (textOrFunc) {
                    description = textOrFunc as string;
                } else if (response.candidates && response.candidates.length > 0) {
                    const candidate = response.candidates[0];
                    if (candidate.content?.parts && candidate.content.parts.length > 0) {
                        description = candidate.content.parts[0].text || "";
                    }
                }

                if (description) {
                    await ctx.runMutation(internal.videos.updateVideoDescription, {
                        videoId: video._id,
                        description: description.trim(),
                    });
                    updated++;
                    console.log(`[batchGenerateDescriptions] Updated: ${video.title}`);
                } else {
                    failed++;
                }
            } catch (error) {
                console.error(`[batchGenerateDescriptions] Failed for ${video.title}:`, error);
                failed++;
            }
        }

        console.log(`[batchGenerateDescriptions] Done: updated=${updated}, skipped=${skipped}, failed=${failed}`);
        return { updated, skipped, failed };
    },
});

export const scanTranscriptionSecurity = action({
    args: {
        videoId: v.optional(v.id("videos")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized: Authentication required");

        const user = await ctx.runQuery(api.users.getUserByClerkIdQuery, {
            clerkId: identity.subject,
        });
        if (!user || !user.isAdmin) throw new Error("Unauthorized: Admin access required");

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

        const client = new GoogleGenAI({ apiKey });

        // Get videos to scan
        let videos: { _id: Id<"videos">; title: string; transcription?: string; zoomChatMessages?: string }[];
        if (args.videoId) {
            const video = await ctx.runQuery(api.videos.getById, { videoId: args.videoId });
            if (!video) throw new Error("Video not found");
            videos = [video];
        } else {
            const allVideos = await ctx.runQuery(internal.videos.getAllVideosInternal);
            videos = allVideos;
        }

        const results: {
            videoId: string;
            title: string;
            findings: {
                severity: string;
                type: string;
                description: string;
                detectedText?: string;
                location: string;
            }[];
        }[] = [];

        for (const video of videos) {
            const textToScan = [video.transcription || "", video.zoomChatMessages || ""].join("\n---CHAT---\n");

            if (textToScan.trim().length === 0) continue;

            try {
                const prompt = `
あなたはセキュリティ監査の専門家です。
以下の動画の文字起こしテキストとチャットログを分析し、セキュリティ上の問題がないか確認してください。

# 検出対象
1. **個人情報 (PII)**: 住所、電話番号、メールアドレス、マイナンバー、クレジットカード番号、生年月日
2. **認証情報**: パスワード、APIキー、環境変数（.envの内容）、シークレットキー、トークン、接続文字列
3. **企業機密**: 社内URL、社内システムのログイン情報、NDA関連、未公開の事業計画、顧客リスト、売上データ
4. **インフラ情報**: サーバーIP、データベース名・接続情報、AWSアカウントID、内部ドメイン名
5. **その他**: 本名の言及（特に生徒・参加者のフルネーム）、スクリーンに映った機密情報への言及

# 重要: JSON形式のみを出力してください
{
  "findings": [
    {
      "severity": "critical|high|medium|low",
      "type": "pii|credential|company_secret|infrastructure|other",
      "description": "何が検出されたかの説明（日本語）",
      "detectedText": "検出された実際のテキスト（短く引用）",
      "location": "transcription または chat"
    }
  ]
}

問題が見つからない場合は {"findings": []} を返してください。

# 動画タイトル
${video.title}

# テキストデータ
${textToScan.slice(0, 20000)}
`;

                const response = await client.models.generateContent({
                    model: "gemini-1.5-flash",
                    contents: [{ role: "user", parts: [{ text: prompt }] }],
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
                    if (candidate.content?.parts && candidate.content.parts.length > 0) {
                        responseText = candidate.content.parts[0].text || "";
                    }
                }

                if (responseText) {
                    responseText = responseText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
                    const parsed = JSON.parse(responseText);

                    if (parsed.findings && parsed.findings.length > 0) {
                        results.push({
                            videoId: video._id,
                            title: video.title,
                            findings: parsed.findings,
                        });

                        // Update security status in DB
                        const dbFindings = parsed.findings.map(
                            (f: { severity: string; type: string; description: string; detectedText?: string }) => ({
                                timestamp: 0,
                                severity: f.severity,
                                type: f.type,
                                description: f.description,
                                detectedText: f.detectedText,
                            }),
                        );
                        await ctx.runMutation(internal.videoSecurityDb.updateSecurityFindings, {
                            videoId: video._id,
                            status: "warning",
                            findings: dbFindings,
                        });

                        console.log(
                            `[scanTranscriptionSecurity] WARNING: ${video.title} - ${parsed.findings.length} findings`,
                        );
                    } else {
                        await ctx.runMutation(internal.videoSecurityDb.updateSecurityScanStatus, {
                            videoId: video._id,
                            status: "clean",
                        });
                        console.log(`[scanTranscriptionSecurity] CLEAN: ${video.title}`);
                    }
                }
            } catch (error) {
                console.error(`[scanTranscriptionSecurity] Error scanning ${video.title}:`, error);
                await ctx.runMutation(internal.videoSecurityDb.updateSecurityScanStatus, {
                    videoId: video._id,
                    status: "error",
                });
            }
        }

        console.log(`[scanTranscriptionSecurity] Scan complete. ${results.length} videos with findings.`);
        return {
            totalScanned: videos.filter((v) => (v.transcription || v.zoomChatMessages || "").trim().length > 0).length,
            videosWithIssues: results.length,
            results,
        };
    },
});
