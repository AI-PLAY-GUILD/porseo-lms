/**
 * サムネイル一括生成・アップロードスクリプト
 *
 * Gemini Imagen APIで動画タイトルに基づいたサムネイルを生成し、
 * Convexストレージにアップロードして動画レコードに紐付ける。
 */
import { GoogleGenAI } from "@google/genai";
import { execSync } from "child_process";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyCLXEMduPPLEzU0KFGW88gT7oaZQMIDcMg";
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// 動画タイトルからサムネイル用プロンプトを生成
function buildPrompt(title) {
    // 【】内のカテゴリを抽出
    const categoryMatch = title.match(/【(.+?)】/);
    const category = categoryMatch ? categoryMatch[1] : "";
    const mainTitle = title.replace(/【.+?】/, "").trim();

    return `Professional YouTube thumbnail design, 16:9 aspect ratio, dark gradient background with subtle tech grid pattern.
Main visual: Modern, clean illustration representing "${mainTitle}" with "${category}" theme.
Style: Minimalist tech aesthetic, neon blue and purple accent lighting, subtle glow effects.
Include abstract tech icons or symbols related to the topic. No text overlay. High quality, vibrant colors, professional composition.
The image should feel like a premium tech education platform thumbnail.`;
}

// Convex internal function を呼び出すヘルパー
function convexRun(func, args = "{}", expectResult = true) {
    const cmd = `npx convex run ${func} "${args.replace(/"/g, '\\"')}"`;
    const result = execSync(cmd, {
        encoding: "utf-8",
        cwd: process.cwd(),
        timeout: 30000,
        stdio: ["pipe", "pipe", "pipe"],
    });
    if (!expectResult) return null;
    // npx convex run outputs extra lines sometimes, extract valid JSON
    const lines = result.trim().split("\n");
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (line.startsWith("{") || line.startsWith("[") || line.startsWith('"')) {
            try {
                return JSON.parse(lines.slice(i).join("\n"));
            } catch {
                // try single line
                try {
                    return JSON.parse(line);
                } catch {
                    continue;
                }
            }
        }
    }
    // Try entire output
    return JSON.parse(result.trim());
}

// 画像を生成
async function generateImage(title) {
    const prompt = buildPrompt(title);
    const response = await ai.models.generateImages({
        model: "imagen-4.0-fast-generate-001",
        prompt,
        config: {
            numberOfImages: 1,
            aspectRatio: "16:9",
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
        return Buffer.from(response.generatedImages[0].image.imageBytes, "base64");
    }
    throw new Error("No image generated");
}

// Convexストレージにアップロード
async function uploadToConvex(imageBuffer) {
    const uploadUrl = convexRun("thumbnailUpload:generateInternalUploadUrl");

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

// メイン処理
async function main() {
    console.log("=== サムネイル一括生成・アップロード ===\n");

    // サムネイルなし動画を取得
    console.log("動画一覧を取得中...");
    const videos = convexRun("thumbnailUpload:listVideosForThumbnails");
    console.log(`サムネイル未設定の動画: ${videos.length}本\n`);

    if (videos.length === 0) {
        console.log("全ての動画にサムネイルが設定済みです。");
        return;
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

            // 2. Convexにアップロード
            const storageId = await uploadToConvex(imageBuffer);
            console.log(`  -> アップロード完了: ${storageId}`);

            // 3. 動画に紐付け
            const args = JSON.stringify({ videoId: video._id, storageId });
            convexRun("thumbnailUpload:setThumbnail", args, false);
            console.log(`  -> 紐付け完了!\n`);

            success++;
        } catch (error) {
            console.error(`  -> エラー: ${error.message}\n`);
            failed++;
            // レート制限対策: エラー時は少し待つ
            await new Promise((r) => setTimeout(r, 3000));
        }

        // レート制限対策: 各生成間に少し待つ
        if (i < videos.length - 1) {
            await new Promise((r) => setTimeout(r, 1000));
        }
    }

    console.log("=== 完了 ===");
    console.log(`成功: ${success}本 / 失敗: ${failed}本 / 合計: ${videos.length}本`);
}

main().catch((e) => {
    console.error("Fatal error:", e.message);
    process.exit(1);
});
