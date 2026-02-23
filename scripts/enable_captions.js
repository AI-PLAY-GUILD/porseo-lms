const Mux = require("@mux/mux-node");
const fs = require("node:fs");
const path = require("node:path");

// Load env manually
const envPath = path.resolve(__dirname, "../.env.local");
const envConfig = fs.readFileSync(envPath, "utf8");
const env = {};
envConfig.split("\n").forEach((line) => {
    const [key, value] = line.split("=");
    if (key && value) {
        env[key.trim()] = value.trim();
    }
});

const mux = new Mux({
    tokenId: env.MUX_TOKEN_ID,
    tokenSecret: env.MUX_TOKEN_SECRET,
});

const ASSET_ID = process.argv[2];

if (!ASSET_ID) {
    console.error("Please provide an Asset ID as an argument.");
    process.exit(1);
}

async function enableCaptions() {
    try {
        console.log(`Fetching asset details for: ${ASSET_ID}...`);
        const asset = await mux.video.assets.retrieve(ASSET_ID);

        const audioTrack = asset.tracks.find((t) => t.type === "audio");
        if (!audioTrack) {
            throw new Error("No audio track found for this asset.");
        }

        console.log(`Found Audio Track ID: ${audioTrack.id}`);
        console.log(`Enabling auto-captions...`);

        // Using fetch for the specific endpoint
        const auth = Buffer.from(`${env.MUX_TOKEN_ID}:${env.MUX_TOKEN_SECRET}`).toString("base64");

        // Endpoint: POST /video/v1/assets/{ASSET_ID}/generated-subtitles
        // Wait, some docs say asset level, some say track level.
        // Let's try the asset level one first as it's more common for "add to asset".
        // If that fails (404), we try the track level.
        // Actually, the search result was specific about track ID. Let's try that.
        // URL: https://api.mux.com/video/v1/assets/{ASSET_ID}/generated-subtitles
        // OR: https://api.mux.com/video/v1/assets/{ASSET_ID}/tracks/{AUDIO_TRACK_ID}/generated-subtitles

        // Let's try the standard "Update Asset" approach first? No, that's PUT.

        // Let's try the one from the search result:
        // POST /video/v1/assets/{ASSET_ID}/generated-subtitles
        // Body: { "generated_subtitles": [{ "language_code": "ja", "name": "Japanese" }] }

        // Actually, let's try the one that matches the "new_asset_settings" structure but for existing assets.
        // It seems `POST /video/v1/assets/${ASSET_ID}/generated-subtitles` is the one.
        // But I got 404. Maybe I need to include the body correctly?

        const response = await fetch(`https://api.mux.com/video/v1/assets/${ASSET_ID}/generated-subtitles`, {
            method: "POST",
            headers: {
                Authorization: `Basic ${auth}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                generated_subtitles: [
                    {
                        language_code: "ja",
                        name: "Japanese",
                    },
                ],
            }),
        });

        if (response.ok) {
            const data = await response.json();
            console.log("✅ Successfully triggered caption generation (Asset Level)!");
            console.log(JSON.stringify(data, null, 2));
            return;
        }

        console.log(`Asset level failed (${response.status}), trying Track level...`);

        // Try Track Level
        const response2 = await fetch(
            `https://api.mux.com/video/v1/assets/${ASSET_ID}/tracks/${audioTrack.id}/generated-subtitles`,
            {
                method: "POST",
                headers: {
                    Authorization: `Basic ${auth}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    language_code: "ja",
                    name: "Japanese",
                }),
            },
        );

        if (!response2.ok) {
            const text = await response2.text();
            throw new Error(`API Error: ${response2.status} ${text}`);
        }

        const data2 = await response2.json();
        console.log("✅ Successfully triggered caption generation (Track Level)!");
        console.log(JSON.stringify(data2, null, 2));
    } catch (e) {
        console.error("Failed to enable captions:", e);
    }
}

enableCaptions();
