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

const _mux = new Mux({
    tokenId: env.MUX_TOKEN_ID,
    tokenSecret: env.MUX_TOKEN_SECRET,
});

async function testUploadCreation() {
    try {
        console.log("Creating test upload URL via FETCH (bypassing SDK)...");

        const auth = Buffer.from(`${env.MUX_TOKEN_ID}:${env.MUX_TOKEN_SECRET}`).toString("base64");

        const body = {
            new_asset_settings: {
                playback_policy: ["public"],
                generated_subtitles: [
                    {
                        language_code: "ja",
                        name: "Japanese",
                    },
                ],
            },
            cors_origin: "*",
        };

        console.log("Sending body:", JSON.stringify(body, null, 2));

        const response = await fetch("https://api.mux.com/video/v1/uploads", {
            method: "POST",
            headers: {
                Authorization: `Basic ${auth}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        console.log(`\nResponse Status: ${response.status}`);
        console.log("Response Object:");
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Failed to create upload:", e);
    }
}

testUploadCreation();
