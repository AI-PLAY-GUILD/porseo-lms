/**
 * Migration Script
 * 
 * Usage:
 * 1. Create a file named `migration_data.json` in the root directory.
 *    Format:
 *    [
 *      {
 *        "email": "user@example.com",
 *        "stripeCustomerId": "cus_...",
 *        "name": "User Name",
 *        "subscriptionStatus": "active",
 *        "clerkId": "user_..." // Optional: Omit for Wix users
 *      },
 *      ...
 *    ]
 * 
 * 2. Run this script:
 *    npx tsx run_migration.ts
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";
import * as fs from "fs";
import * as path from "path";

// Manually load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
let convexUrl = process.env.CONVEX_URL;

if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, "utf-8");
    for (const line of envConfig.split("\n")) {
        const match = line.match(/^CONVEX_URL=(.*)$/);
        if (match) {
            convexUrl = match[1].trim();
            // Remove quotes if present
            if (convexUrl.startsWith('"') && convexUrl.endsWith('"')) {
                convexUrl = convexUrl.slice(1, -1);
            }
            break;
        }
    }
}

if (!convexUrl) {
    console.error("Error: CONVEX_URL is not defined in .env.local or environment variables");
    process.exit(1);
}

const client = new ConvexHttpClient(convexUrl);

async function main() {
    const dataPath = "migration_data.json";

    if (!fs.existsSync(dataPath)) {
        console.error(`Error: ${dataPath} not found. Please create it first.`);
        process.exit(1);
    }

    const rawData = fs.readFileSync(dataPath, "utf-8");
    const users = JSON.parse(rawData);

    console.log(`Starting migration for ${users.length} users...`);

    // Process in chunks of 50 to avoid timeout/size limits
    const CHUNK_SIZE = 50;
    for (let i = 0; i < users.length; i += CHUNK_SIZE) {
        const chunk = users.slice(i, i + CHUNK_SIZE);
        console.log(`Processing chunk ${i / CHUNK_SIZE + 1} (${chunk.length} users)...`);

        try {
            // @ts-ignore
            const result = await client.mutation(api.internal.batchMigrateUsers, { users: chunk });
            console.log("Result:", result);
        } catch (error) {
            console.error("Error migrating chunk:", error);
        }
    }

    console.log("Migration complete!");
}

main().catch(console.error);
