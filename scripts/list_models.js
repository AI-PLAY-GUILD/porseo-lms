const fs = require('fs');
const path = require('path');

// Load env manually
const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
const env = {};
envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim();
    }
});

async function listModels() {
    // const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    try {
        // Note: listModels might not be directly available on genAI instance in some SDK versions,
        // but let's try or use the model manager if available.
        // Actually, for @google/generative-ai, it's usually via `genAI.getGenerativeModel` but listing is separate?
        // The error message suggested: "Call ListModels to see the list of available models"
        // This is usually a REST API call. Let's use fetch for certainty.

        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${env.GEMINI_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        console.log("Available Models:");
        if (data.models) {
            data.models.forEach(m => {
                if (m.name.includes('gemini')) {
                    console.log(`- ${m.name} (${m.displayName})`);
                }
            });
        } else {
            console.log(JSON.stringify(data, null, 2));
        }

    } catch (e) {
        console.error("Error listing models:", e);
    }
}

listModels();
