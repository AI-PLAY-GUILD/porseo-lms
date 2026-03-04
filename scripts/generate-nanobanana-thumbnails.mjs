/**
 * gemini-3.1-flash-image-preview でサムネイル一括生成・プロダクションアップロード
 *
 * 非公開動画のサムネイルをサイバーパンク/アニメ風に生成し、
 * Convex プロダクション環境にアップロードする。
 *
 * 使い方:
 *   1. npx convex run thumbnailUpload:listVideosForThumbnailsWithTranscription '{}' --prod > thumbnails/videos_to_process.json
 *   2. node --env-file=.env.local scripts/generate-nanobanana-thumbnails.mjs
 */
import { GoogleGenAI } from "@google/genai";
import { execSync } from "child_process";
import fs from "fs";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    console.error(
        "GEMINI_API_KEY is required. Use: node --env-file=.env.local scripts/generate-nanobanana-thumbnails.mjs",
    );
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const VIDEOS_JSON = "./thumbnails/videos_to_process.json";

// nanobanana_test.png のスタイルを再現するプロンプト
function buildPrompt(title) {
    const categoryMatch = title.match(/【(.+?)】/);
    const category = categoryMatch ? categoryMatch[1] : "";
    const mainTitle = title.replace(/【.+?】/, "").trim();

    let displayText = category || mainTitle;
    if (displayText.length > 15) {
        displayText = displayText.substring(0, 15);
    }

    return `YouTubeサムネイル画像を生成してください。以下の条件を厳守：

【必須テキスト】画像の中央に「${displayText}」と大きく太い日本語テキストで表示
【スタイル】サイバーパンク・アニメ風YouTubeサムネイル
【背景】暗いサイバーパンクの夜景都市、ネオンブルーと電気パープルのライティング
【エフェクト】雷、ロケット、グロー粒子、レンズフレア、ボリュメトリックライティング
【キャラクター】フード姿のハッカーやアニメキャラクター
【アスペクト比】16:9（横長）
【テキストスタイル】白い極太フォント、ネオンの光彩エフェクト付き
【重要】テキストは画像の50%以上を占める大きさで、はっきり読めること`;
}

// Convex CLI でプロダクション環境の関数を呼び出す
function convexRunProd(func, args = "{}", expectResult = true) {
    const escapedArgs = args.replace(/"/g, '\\"');
    const cmd = `npx convex run ${func} "${escapedArgs}" --prod`;
    const result = execSync(cmd, {
        encoding: "utf-8",
        cwd: process.cwd(),
        timeout: 30000,
        maxBuffer: 10 * 1024 * 1024,
        stdio: ["pipe", "pipe", "pipe"],
    });
    if (!expectResult) return null;
    const lines = result.trim().split("\n");
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (line.startsWith("{") || line.startsWith("[") || line.startsWith('"')) {
            try {
                return JSON.parse(lines.slice(i).join("\n"));
            } catch {
                try {
                    return JSON.parse(line);
                } catch {
                    continue;
                }
            }
        }
    }
    return JSON.parse(result.trim());
}

// 画像生成
async function generateImage(title) {
    const prompt = buildPrompt(title);
    const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-image-preview",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
            responseModalities: ["IMAGE", "TEXT"],
        },
    });

    if (response.candidates && response.candidates.length > 0) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.mimeType?.startsWith("image/")) {
                return Buffer.from(part.inlineData.data, "base64");
            }
        }
    }
    throw new Error("No image in response");
}

// Convex プロダクションストレージにアップロード
async function uploadToConvexProd(imageBuffer) {
    const uploadUrl = convexRunProd("thumbnailUpload:generateInternalUploadUrl");
    const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "image/png" },
        body: imageBuffer,
    });
    if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
    }
    const { storageId } = await response.json();
    return storageId;
}

async function main() {
    console.log("=== サムネイル一括生成（プロダクション） ===\n");

    // 事前生成した JSON ファイルから動画リストを読み込み
    if (!fs.existsSync(VIDEOS_JSON)) {
        console.error(`${VIDEOS_JSON} が見つかりません。先に以下を実行してください:`);
        console.error(
            `npx convex run thumbnailUpload:listVideosForThumbnailsWithTranscription '{}' --prod > ${VIDEOS_JSON}`,
        );
        process.exit(1);
    }

    const videos = JSON.parse(fs.readFileSync(VIDEOS_JSON, "utf-8"));
    console.log(`サムネイル未設定の動画: ${videos.length}本\n`);

    if (videos.length === 0) {
        console.log("全ての動画にサムネイルが設定済みです。");
        return;
    }

    if (!fs.existsSync("./thumbnails/generated")) {
        fs.mkdirSync("./thumbnails/generated", { recursive: true });
    }

    let success = 0;
    let failed = 0;

    for (let i = 0; i < videos.length; i++) {
        const video = videos[i];
        const progress = `[${i + 1}/${videos.length}]`;

        try {
            console.log(`${progress} 生成中: ${video.title}`);

            // 1. 画像生成
            const imageBuffer = await generateImage(video.title);
            console.log(`  -> 画像生成完了 (${(imageBuffer.length / 1024).toFixed(0)}KB)`);

            // ローカル保存
            const safeTitle = video.title.replace(/[【】\s/\\:*?"<>|&]/g, "_").substring(0, 30);
            fs.writeFileSync(`./thumbnails/generated/${safeTitle}.png`, imageBuffer);

            // 2. Convexプロダクションにアップロード
            const storageId = await uploadToConvexProd(imageBuffer);
            console.log(`  -> アップロード完了: ${storageId}`);

            // 3. 動画に紐付け
            const args = JSON.stringify({ videoId: video._id, storageId });
            convexRunProd("thumbnailUpload:setThumbnail", args, false);
            console.log(`  -> 紐付け完了!\n`);

            success++;
        } catch (error) {
            console.error(`  -> エラー: ${error.message}\n`);
            failed++;
            await new Promise((r) => setTimeout(r, 5000));
        }

        // レート制限対策
        if (i < videos.length - 1) {
            await new Promise((r) => setTimeout(r, 3000));
        }
    }

    console.log("=== 完了 ===");
    console.log(`成功: ${success}本 / 失敗: ${failed}本 / 合計: ${videos.length}本`);
}

main().catch((e) => {
    console.error("Fatal error:", e.message);
    process.exit(1);
});
