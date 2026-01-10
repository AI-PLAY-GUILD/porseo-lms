
import * as fs from 'fs';
import * as readline from 'readline';

const INPUT_FILE = 'snapshot_data/users/documents.jsonl';
const OUTPUT_FILE = 'users_to_migrate.jsonl';
const ADMIN_EMAIL = 'shunlokbne721@gmail.com';

async function main() {
    const fileStream = fs.createReadStream(INPUT_FILE);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const outputStream = fs.createWriteStream(OUTPUT_FILE); // New output stream
    let count = 0;
    let skipped = 0;

    for await (const line of rl) {
        if (!line.trim()) continue;
        try {
            const user = JSON.parse(line);

            // Skip admin
            if (user.email === ADMIN_EMAIL) {
                console.log(`Skipping admin user: ${user.email}`);
                skipped++;
                continue;
            }

            // Skip if not a migrated user (optional check, but safer to migrate everyone who isn't admin)
            // Actually, we want to migrate everyone except the admin who already exists in prod.

            // We need to clean up the user object for the mutation.
            // The mutation expects: clerkId, email, name, subscriptionStatus, stripeCustomerId, etc.
            // The export has `_id`, `_creationTime`, etc. We should remove system fields.

            const userData = {
                clerkId: user.clerkId,
                email: user.email,
                name: user.name,
                imageUrl: user.imageUrl,
                discordId: user.discordId,
                discordRoles: user.discordRoles || [],
                stripeCustomerId: user.stripeCustomerId,
                subscriptionStatus: user.subscriptionStatus,
                subscriptionName: user.subscriptionName,
                isAdmin: user.isAdmin,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                // We don't pass _id or _creationTime, let Prod generate them.
            };

            outputStream.write(JSON.stringify(userData) + '\n'); // Write each object as a line
            count++;
        } catch (e) {
            console.error('Error parsing line:', e);
        }
    }

    outputStream.end(); // Close the stream
    console.log(`Prepared ${count} users for migration in ${OUTPUT_FILE}. Skipped ${skipped} users.`); // Updated log message
}

main().catch(console.error);
