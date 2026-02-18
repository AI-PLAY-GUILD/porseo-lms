
import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api";
import * as fs from 'fs';
import { execSync } from 'child_process';

const USERS_FILE = 'users_to_migrate.json';
const BATCH_SIZE = 20;

async function main() {
    const prodUrl = "https://agile-egret-492.convex.cloud";

    console.log(`Targeting Production: ${prodUrl}`);
    const client = new ConvexHttpClient(prodUrl);

    const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    console.log(`Loaded ${users.length} users to migrate.`);

    for (let i = 0; i < users.length; i += BATCH_SIZE) {
        const batch = users.slice(i, i + BATCH_SIZE);
        console.log(`Migrating batch ${i / BATCH_SIZE + 1} (${batch.length} users)...`);

        try {
            await client.action((api as any).migration_action.runBatchMigrate, { users: batch });
            console.log(`Batch ${i / BATCH_SIZE + 1} complete.`);
        } catch (e) {
            console.error(`Error in batch ${i / BATCH_SIZE + 1}:`, e);
            // Don't stop, try next batch? Or stop?
            // Stop to be safe.
            process.exit(1);
        }
    }

    console.log("Migration complete!");
}

main().catch(console.error);
