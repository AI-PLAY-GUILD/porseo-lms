import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const CONVEX_DEPLOYMENT = process.env.CONVEX_DEPLOYMENT || "prod:agile-egret-492";
const MAPPING_MD = path.join(ROOT, "thumbnails", "summaries", "lectures-for-thumbnails.md");

function runConvex(args, options = {}) {
    return execFileSync("npx", ["convex", ...args], {
        cwd: ROOT,
        encoding: options.encoding ?? "utf-8",
        maxBuffer: 64 * 1024 * 1024,
        env: {
            ...process.env,
            CONVEX_DEPLOYMENT,
        },
    });
}

function getInternalSecret() {
    if (process.env.CONVEX_INTERNAL_SECRET) {
        return process.env.CONVEX_INTERNAL_SECRET;
    }
    return runConvex(["env", "get", "CONVEX_INTERNAL_SECRET"]).trim();
}

function parseConvexJson(output) {
    const lines = output.trim().split("\n");
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (!line) continue;
        if (line.startsWith("{") || line.startsWith("[") || line.startsWith('"')) {
            try {
                return JSON.parse(line);
            } catch {
                try {
                    return JSON.parse(lines.slice(i).join("\n"));
                } catch {
                    // Try the previous candidate line.
                }
            }
        }
    }
    throw new Error(`Could not parse Convex output: ${output.slice(0, 500)}`);
}

function parseMappings() {
    const md = fs.readFileSync(MAPPING_MD, "utf-8");
    const rows = md
        .split("\n")
        .filter((line) => /^\| \d{2} \|/.test(line))
        .map((line) => line.split("|").map((cell) => cell.trim()));

    return rows.map((cells) => {
        const hasStorageColumn = cells.length >= 9;
        const sourceMdIndex = hasStorageColumn ? 6 : 5;
        const thumbnailPathIndex = hasStorageColumn ? 7 : 6;
        const no = cells[1];
        const title = cells[2];
        const videoId = cells[3].replaceAll("`", "");
        const muxPlaybackId = cells[4].replaceAll("`", "");
        const currentStorageId = hasStorageColumn ? cells[5].replaceAll("`", "") : null;
        const sourceMd = cells[sourceMdIndex].replaceAll("`", "");
        const thumbnailPath = cells[thumbnailPathIndex].replaceAll("`", "");
        return {
            no,
            title,
            videoId,
            muxPlaybackId,
            currentStorageId,
            sourceMd,
            thumbnailPath,
            absoluteThumbnailPath: path.join(ROOT, thumbnailPath),
        };
    });
}

async function uploadToConvexStorage(filePath, secret) {
    const uploadUrl = parseConvexJson(runConvex(["run", "videos:generateUploadUrlServer", JSON.stringify({ secret })]));

    const imageBuffer = fs.readFileSync(filePath);
    const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "image/png" },
        body: imageBuffer,
    });

    if (!response.ok) {
        throw new Error(`Storage upload failed: ${response.status} ${response.statusText}`);
    }

    const { storageId } = await response.json();
    return storageId;
}

function setVideoThumbnail(videoId, storageId, secret) {
    runConvex(
        [
            "run",
            "videos:setThumbnailServer",
            JSON.stringify({
                videoId,
                storageId,
                secret,
            }),
        ],
        { encoding: "utf-8" },
    );
}

async function main() {
    const mappings = parseMappings();
    if (mappings.length !== 12) {
        throw new Error(`Expected 12 mappings, found ${mappings.length}`);
    }

    for (const mapping of mappings) {
        if (!fs.existsSync(mapping.absoluteThumbnailPath)) {
            throw new Error(`Thumbnail not found for ${mapping.no}: ${mapping.thumbnailPath}`);
        }
    }

    const secret = getInternalSecret();
    const results = [];

    console.log(`Uploading ${mappings.length} thumbnails to Convex production deployment: ${CONVEX_DEPLOYMENT}`);
    for (const mapping of mappings) {
        console.log(`[${mapping.no}/12] ${mapping.videoId} ${mapping.title}`);
        const storageId = await uploadToConvexStorage(mapping.absoluteThumbnailPath, secret);
        setVideoThumbnail(mapping.videoId, storageId, secret);
        results.push({ ...mapping, storageId });
        console.log(`  -> linked storageId=${storageId}`);
    }

    const reportPath = path.join(ROOT, "thumbnails", "generated", "lecture-thumbnails", "convex-upload-report.json");
    fs.writeFileSync(
        reportPath,
        JSON.stringify(
            {
                uploadedAt: new Date().toISOString(),
                convexDeployment: CONVEX_DEPLOYMENT,
                count: results.length,
                results: results.map(({ no, title, videoId, muxPlaybackId, thumbnailPath, storageId }) => ({
                    no,
                    title,
                    videoId,
                    muxPlaybackId,
                    thumbnailPath,
                    storageId,
                })),
            },
            null,
            2,
        ),
    );
    console.log(`Wrote report: ${path.relative(ROOT, reportPath)}`);
}

main().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
