
import { query } from "./_generated/server";

export const checkDuplicates = query({
    args: {},
    handler: async (ctx) => {
        const users = await ctx.db.query("users").collect();
        const emailCounts: Record<string, number> = {};
        const duplicates: string[] = [];

        for (const user of users) {
            const email = user.email;
            if (emailCounts[email]) {
                emailCounts[email]++;
                if (emailCounts[email] === 2) {
                    duplicates.push(email);
                }
            } else {
                emailCounts[email] = 1;
            }
        }

        return {
            totalUsers: users.length,
            duplicateCount: duplicates.length,
            duplicates: duplicates,
        };
    },
});
