/**
 * サムネイル一括生成・アップロードスクリプト
 *
 * Gemini Imagen APIでサイバーパンク風の背景画像を生成し、
 * sharpで日本語テキストオーバーレイを追加して
 * Convexストレージにアップロードして動画レコードに紐付ける。
 */
import { GoogleGenAI } from "@google/genai";
import { execSync } from "child_process";
import fs from "fs";
import sharp from "sharp";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY required");
    process.exit(1);
}
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const FONT_FAMILY = "'Yu Gothic', 'Meiryo', 'Hiragino Kaku Gothic Pro', sans-serif";

// 動画タイトルからImagen用プロンプトを生成（nanobanana_test.png風サイバーパンクスタイル）
function buildPrompt(title) {
    const categoryMatch = title.match(/【(.+?)】/);
    const category = categoryMatch ? categoryMatch[1] : "";
    const mainTitle = title.replace(/【.+?】/, "").trim();

    // タイトルからキーワードを抽出してビジュアル要素を決定
    const keywords = `${category} ${mainTitle}`;
    let visualElement = "a hooded hacker figure typing on a glowing laptop with holographic code screens";

    if (keywords.match(/AI|人工知能|Claude|GPT|Gemini|ChatGPT/i)) {
        visualElement = "a futuristic AI robot brain with glowing neural networks and holographic interfaces";
    } else if (keywords.match(/開発|アプリ|コード|Code|プログラ|実装/i)) {
        visualElement =
            "a hooded developer coding on multiple holographic screens with rocket ship launching in background";
    } else if (keywords.match(/Discord|連携|コミュニティ/i)) {
        visualElement = "interconnected glowing network nodes and chat bubbles in a cyberpunk cityscape";
    } else if (keywords.match(/Zoom|ミーティング|会議|共有会|雑談/i)) {
        visualElement = "a futuristic virtual meeting room with holographic participant avatars in neon-lit space";
    } else if (keywords.match(/収益|ビジネス|マネタイズ|ARR|売上/i)) {
        visualElement =
            "rising holographic charts and crypto-style coins floating in a neon city with rocket launching upward";
    } else if (keywords.match(/セキュリティ|セルフホスト|GPU|サーバー/i)) {
        visualElement = "a fortified digital vault with glowing shields and server racks in cyberpunk style";
    } else if (keywords.match(/動画|編集|音声|アバター/i)) {
        visualElement = "a glowing video player interface with sound waves and anime-style digital avatar";
    } else if (keywords.match(/Cursor|Finity|ツール|プラグイン/i)) {
        visualElement = "floating futuristic tool icons and gear mechanisms in a holographic workspace";
    } else if (keywords.match(/初心者|設定|カスタマイズ/i)) {
        visualElement = "a friendly anime-style guide character pointing at glowing tutorial screens";
    } else if (keywords.match(/万博|旅|福岡|大阪/i)) {
        visualElement = "a futuristic Japanese cityscape with neon signs and holographic landmarks";
    } else if (keywords.match(/デザイン|Figma|UI/i)) {
        visualElement = "holographic UI wireframes and design tools floating in neon-lit creative studio";
    }

    return `Dramatic YouTube thumbnail background illustration, 16:9 aspect ratio, NO TEXT whatsoever.
Dark cyberpunk city background with deep blue and purple neon lighting. Electric lightning bolts and energy beams.
Main visual: ${visualElement}.
Style: Bold dramatic anime-influenced digital art, intense neon blue and electric purple color scheme, volumetric lighting, lens flares, glowing particles.
Futuristic skyscraper silhouettes in background. High contrast, cinematic composition. Premium quality digital illustration.
IMPORTANT: Do NOT include any text, letters, numbers, or characters in the image.`;
}

// タイトルからテキストオーバーレイSVGを生成
function createOverlaySvg(title, width, height) {
    const categoryMatch = title.match(/【(.+?)】/);
    const category = categoryMatch ? categoryMatch[1] : "";
    const mainTitle = title.replace(/【.+?】/, "").trim();

    // メインタイトルを折り返し（1行あたり最大8文字で大きく表示）
    const maxChars = 8;
    const lines = [];
    let remaining = mainTitle;
    while (remaining.length > maxChars) {
        lines.push(remaining.substring(0, maxChars));
        remaining = remaining.substring(maxChars);
    }
    if (remaining) lines.push(remaining);

    const titleFontSize = 80;
    const categoryFontSize = 40;
    const lineHeight = titleFontSize * 1.25;

    // テキストを中央配置
    const categoryHeight = category ? categoryFontSize + 30 : 0;
    const titleBlockHeight = lines.length * lineHeight;
    const totalTextHeight = categoryHeight + titleBlockHeight;
    const startY = (height - totalTextHeight) / 2;

    let textElements = "";

    // カテゴリバッジ
    if (category) {
        const badgeWidth = category.length * categoryFontSize * 0.65 + 40;
        const badgeX = (width - badgeWidth) / 2;
        textElements += `
        <rect x="${badgeX}" y="${startY - 8}" rx="10" ry="10" width="${badgeWidth}" height="${categoryFontSize + 16}" fill="#7c3aed" opacity="0.95"/>
        <text x="${width / 2}" y="${startY + categoryFontSize - 4}" font-family="${FONT_FAMILY}" font-size="${categoryFontSize}" font-weight="900" fill="white" text-anchor="middle">${escapeXml(category)}</text>`;
    }

    // メインタイトル（太い白文字＋黒縁取り）
    lines.forEach((line, i) => {
        const y = startY + categoryHeight + (i + 1) * lineHeight;
        // 影
        textElements += `
        <text x="${width / 2 + 4}" y="${y + 4}" font-family="${FONT_FAMILY}" font-size="${titleFontSize}" font-weight="900" fill="black" opacity="0.6" text-anchor="middle">${escapeXml(line)}</text>`;
        // 縁取り
        textElements += `
        <text x="${width / 2}" y="${y}" font-family="${FONT_FAMILY}" font-size="${titleFontSize}" font-weight="900" fill="white" stroke="black" stroke-width="4" paint-order="stroke" text-anchor="middle">${escapeXml(line)}</text>`;
    });

    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="overlay" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="black" stop-opacity="0.3"/>
                <stop offset="40%" stop-color="black" stop-opacity="0.15"/>
                <stop offset="60%" stop-color="black" stop-opacity="0.15"/>
                <stop offset="100%" stop-color="black" stop-opacity="0.4"/>
            </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#overlay)"/>
        ${textElements}
    </svg>`;
}

function escapeXml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
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

// 画像を生成（Imagen）
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

// テキストオーバーレイを追加
async function addTextOverlay(imageBuffer, title) {
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    const width = metadata.width;
    const height = metadata.height;

    const svgOverlay = createOverlaySvg(title, width, height);

    return await image
        .composite([
            {
                input: Buffer.from(svgOverlay),
                top: 0,
                left: 0,
            },
        ])
        .png()
        .toBuffer();
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
    console.log("=== サムネイル一括生成・アップロード（サイバーパンク風） ===\n");

    // サムネイルなし動画を取得
    console.log("動画一覧を取得中...");
    const videos = convexRun("thumbnailUpload:listVideosForThumbnails");
    console.log(`サムネイル未設定の動画: ${videos.length}本\n`);

    if (videos.length === 0) {
        console.log("全ての動画にサムネイルが設定済みです。");
        return;
    }

    // thumbnailsディレクトリ確認
    if (!fs.existsSync("./thumbnails")) {
        fs.mkdirSync("./thumbnails", { recursive: true });
    }

    let success = 0;
    let failed = 0;

    for (let i = 0; i < videos.length; i++) {
        const video = videos[i];
        const progress = `[${i + 1}/${videos.length}]`;

        try {
            console.log(`${progress} 生成中: ${video.title}`);

            // 1. 背景画像生成（Imagen）
            const rawImage = await generateImage(video.title);
            console.log(`  -> 背景画像生成完了 (${(rawImage.length / 1024).toFixed(0)}KB)`);

            // 2. テキストオーバーレイ追加（sharp）
            const finalImage = await addTextOverlay(rawImage, video.title);
            console.log(`  -> テキストオーバーレイ追加完了 (${(finalImage.length / 1024).toFixed(0)}KB)`);

            // ローカルにも保存（確認用）
            const safeTitle = video.title.replace(/[【】\s/\\:*?"<>|]/g, "_").substring(0, 30);
            fs.writeFileSync(`./thumbnails/generated_${safeTitle}.png`, finalImage);

            // 3. Convexにアップロード
            const storageId = await uploadToConvex(finalImage);
            console.log(`  -> アップロード完了: ${storageId}`);

            // 4. 動画に紐付け
            const args = JSON.stringify({ videoId: video._id, storageId });
            convexRun("thumbnailUpload:setThumbnail", args, false);
            console.log(`  -> 紐付け完了!\n`);

            success++;
        } catch (error) {
            console.error(`  -> エラー: ${error.message}\n`);
            failed++;
            // レート制限対策: エラー時は少し待つ
            await new Promise((r) => setTimeout(r, 5000));
        }

        // レート制限対策: 各生成間に少し待つ
        if (i < videos.length - 1) {
            await new Promise((r) => setTimeout(r, 2000));
        }
    }

    console.log("=== 完了 ===");
    console.log(`成功: ${success}本 / 失敗: ${failed}本 / 合計: ${videos.length}本`);
}

main().catch((e) => {
    console.error("Fatal error:", e.message);
    process.exit(1);
});
