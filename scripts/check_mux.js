const Mux = require("@mux/mux-node");
const fs = require("node:fs");
const path = require("node:path");

// Load env manually since dotenv is not installed
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

async function checkLatestAsset() {
    try {
        console.log("Fetching latest assets from Mux...");
        const assets = await mux.video.assets.list({ limit: 5 });

        for (const asset of assets.data) {
            console.log(`\n--------------------------------------------------`);
            console.log(`Asset ID: ${asset.id}`);
            console.log(`Created At: ${new Date(asset.created_at * 1000).toLocaleString()}`);
            console.log(`Status: ${asset.status}`);
            console.log(`Duration: ${asset.duration}s`);

            if (asset.tracks) {
                console.log("Tracks:");
                let hasSubtitles = false;
                asset.tracks.forEach((track) => {
                    let info = `  - [${track.type}] ID: ${track.id}, Status: ${track.status}`;
                    if (track.type === "text") {
                        info += `, Text Type: ${track.text_type}, Lang: ${track.language_code}, Name: ${track.name}`;
                        if (track.text_type === "subtitles") hasSubtitles = true;
                    }
                    console.log(info);
                });

                if (!hasSubtitles) {
                    console.log("  ⚠️  NO SUBTITLES FOUND");
                } else {
                    console.log("  ✅  Subtitles found");
                }
            } else {
                console.log("  No tracks found.");
            }
        }
    } catch (e) {
        console.error("Error fetching assets:", e);
    }
}

checkLatestAsset();
