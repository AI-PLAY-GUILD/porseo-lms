/**
 * サムネイル画像に日本語タイトルをオーバーレイするスクリプト
 * sharp の SVG composite を使用
 */
import fs from "fs";
import sharp from "sharp";

const FONT_FAMILY = "'Yu Gothic', 'Meiryo', sans-serif";

/**
 * タイトルからカテゴリと本文を分離
 */
function parseTitle(title) {
    const match = title.match(/【(.+?)】(.+)/);
    if (match) {
        return { category: match[1], mainTitle: match[2].trim() };
    }
    return { category: "", mainTitle: title };
}

/**
 * テキストを指定文字数で折り返し
 */
function wrapText(text, maxChars) {
    const lines = [];
    let remaining = text;
    while (remaining.length > maxChars) {
        lines.push(remaining.substring(0, maxChars));
        remaining = remaining.substring(maxChars);
    }
    if (remaining) lines.push(remaining);
    return lines;
}

/**
 * YouTube風テキストオーバーレイSVGを生成
 */
function createOverlaySvg(title, width, height) {
    const { category, mainTitle } = parseTitle(title);
    const lines = wrapText(mainTitle, 12);

    const titleFontSize = 64;
    const categoryFontSize = 36;
    const lineHeight = titleFontSize * 1.3;

    // テキストブロックの高さ計算
    const categoryHeight = category ? categoryFontSize + 20 : 0;
    const titleBlockHeight = lines.length * lineHeight;
    const totalTextHeight = categoryHeight + titleBlockHeight;

    // テキストブロックのY開始位置（下寄せ）
    const textBlockY = height - totalTextHeight - 60;

    // 半透明グラデーション背景（下部）
    const gradientHeight = totalTextHeight + 140;
    const gradientY = height - gradientHeight;

    let textElements = "";

    // カテゴリタグ
    if (category) {
        textElements += `
        <rect x="40" y="${textBlockY - 10}" rx="8" ry="8" width="${category.length * categoryFontSize * 0.7 + 32}" height="${categoryFontSize + 16}" fill="#6366f1" opacity="0.95"/>
        <text x="56" y="${textBlockY + categoryFontSize - 6}" font-family="${FONT_FAMILY}" font-size="${categoryFontSize}" font-weight="900" fill="white">${escapeXml(category)}</text>`;
    }

    // メインタイトル
    lines.forEach((line, i) => {
        const y = textBlockY + categoryHeight + (i + 1) * lineHeight;
        // テキスト影（アウトライン効果）
        textElements += `
        <text x="42" y="${y + 3}" font-family="${FONT_FAMILY}" font-size="${titleFontSize}" font-weight="900" fill="black" opacity="0.7">${escapeXml(line)}</text>
        <text x="40" y="${y}" font-family="${FONT_FAMILY}" font-size="${titleFontSize}" font-weight="900" fill="white" stroke="black" stroke-width="2" paint-order="stroke">${escapeXml(line)}</text>`;
    });

    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="black" stop-opacity="0"/>
                <stop offset="30%" stop-color="black" stop-opacity="0.3"/>
                <stop offset="100%" stop-color="black" stop-opacity="0.85"/>
            </linearGradient>
        </defs>
        <rect x="0" y="${gradientY}" width="${width}" height="${gradientHeight}" fill="url(#grad)"/>
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

async function addTextOverlay(inputPath, outputPath, title) {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    const width = metadata.width;
    const height = metadata.height;

    const svgOverlay = createOverlaySvg(title, width, height);

    await image
        .composite([
            {
                input: Buffer.from(svgOverlay),
                top: 0,
                left: 0,
            },
        ])
        .png()
        .toFile(outputPath);

    console.log(`Output: ${outputPath}`);
}

// テスト実行
const title = "【爆速AIアプリ開発】スキルズで要件定義からデプロイまで自動化ハンズオン";

await addTextOverlay("./thumbnails/anime_style_1.png", "./thumbnails/anime_with_text_1.png", title);
await addTextOverlay("./thumbnails/anime_style_2.png", "./thumbnails/anime_with_text_2.png", title);

console.log("Done!");
