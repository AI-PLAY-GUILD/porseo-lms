import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import sharp from "sharp";

const BASE_IMAGE_PATH = "C:/Users/User/porseo-lms/thumbnails/nanobanana_test.png";
const FONT_FAMILY = "'Yu Gothic', 'Meiryo', 'Hiragino Kaku Gothic Pro', sans-serif";

function convexRun(func, args = "{}", expectResult = true) {
    const cmd = `npx convex run ${func} "${args.replace(/"/g, '\\"')}"`;
    const result = execSync(cmd, {
        encoding: "utf-8",
        cwd: process.cwd(),
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
                continue;
            }
        }
    }
    return JSON.parse(result.trim());
}

function escapeXml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function createOverlaySvg(title, width, height) {
    // 1行が長くなりすぎないように調整（8文字程度で改行）
    const maxChars = 8;
    const lines = [];
    let currentLine = "";

    // 元のタイトルから不要な記号を除去
    const cleanTitle = title.replace(/【.*?】/g, "").trim() || title;

    for (const char of cleanTitle) {
        if (currentLine.length >= maxChars) {
            lines.push(currentLine);
            currentLine = "";
        }
        currentLine += char;
    }
    if (currentLine) lines.push(currentLine);

    const titleFontSize = lines.length > 3 ? 60 : 80;
    const lineHeight = titleFontSize * 1.3;
    const totalHeight = lines.length * lineHeight;
    const startY = (height - totalHeight) / 2 + titleFontSize;

    let textElements = "";
    lines.forEach((line, i) => {
        const y = startY + i * lineHeight;
        // 影
        textElements += `<text x="${width / 2 + 4}" y="${y + 4}" font-family="${FONT_FAMILY}" font-size="${titleFontSize}" font-weight="900" fill="black" opacity="0.7" text-anchor="middle">${escapeXml(line)}</text>`;
        // メイン文字
        textElements += `<text x="${width / 2}" y="${y}" font-family="${FONT_FAMILY}" font-size="${titleFontSize}" font-weight="900" fill="white" stroke="#ff00ff" stroke-width="3" paint-order="stroke" text-anchor="middle">${escapeXml(line)}</text>`;
    });

    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="black" fill-opacity="0.2" />
        ${textElements}
    </svg>`;
}

async function uploadToConvex(imageBuffer) {
    const uploadUrl = convexRun("thumbnailUpload:generateInternalUploadUrl");
    const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "image/png" },
        body: imageBuffer,
    });
    if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
    const { storageId } = await response.json();
    return storageId;
}

async function main() {
    console.log("Fetching videos without thumbnails...");
    const videos = convexRun("thumbnailUpload:listVideosForThumbnailsWithTranscription");
    console.log(`Found ${videos.length} videos to process.\n`);

    if (videos.length === 0) {
        console.log("No videos found without thumbnails.");
        return;
    }

    if (!fs.existsSync(BASE_IMAGE_PATH)) {
        console.error("Base image not found:", BASE_IMAGE_PATH);
        return;
    }

    const baseImage = sharp(BASE_IMAGE_PATH);
    const { width, height } = await baseImage.metadata();

    for (let i = 0; i < videos.length; i++) {
        const video = videos[i];
        // 元のタイトルをベースにする（文字起こしからの抽出は既に動画タイトルに反映されていることが多いため）
        const displayTitle = video.title;
        console.log(`[${i + 1}/${videos.length}] Processing: ${displayTitle}`);

        try {
            const svgOverlay = createOverlaySvg(displayTitle, width, height);
            const finalImage = await sharp(BASE_IMAGE_PATH)
                .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
                .png()
                .toBuffer();

            const storageId = await uploadToConvex(finalImage);
            console.log(`  -> Uploaded: ${storageId}`);

            convexRun("thumbnailUpload:setThumbnail", JSON.stringify({ videoId: video._id, storageId }), false);
            console.log(`  -> Registered successfully.\n`);
        } catch (error) {
            console.error(`  -> Failed: ${error.message}\n`);
        }
    }

    console.log("All tasks completed!");
}

main().catch(console.error);
