import { NextResponse } from 'next/server';
import { convex } from '@/lib/convex';
import { auth } from '@clerk/nextjs/server';

const discordToken = process.env.DISCORD_BOT_TOKEN;
const guildId = process.env.DISCORD_GUILD_ID;
const roleId = process.env.DISCORD_ROLE_ID;

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Get user from Convex
        const user = await convex.query("users:getUserByClerkIdServer" as any, {
            clerkId: userId,
            secret: process.env.CONVEX_INTERNAL_SECRET || "",
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // If already active, return success
        if (user.subscriptionStatus === 'active') {
            return NextResponse.json({ status: 'active' });
        }

        if (!user.discordId) {
            return NextResponse.json({ error: 'Discord ID not linked' }, { status: 400 });
        }

        // 2. Check Discord Roles
        if (!discordToken || !guildId || !roleId) {
            console.error("Missing Discord env vars");
            return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
        }

        const discordRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${user.discordId}`, {
            headers: {
                'Authorization': `Bot ${discordToken}`,
            },
        });

        if (!discordRes.ok) {
            const errorText = await discordRes.text();
            console.error("Discord API Error:", errorText);
            // If user is not in server (404), we can't check roles
            if (discordRes.status === 404) {
                return NextResponse.json({ error: 'User not in Discord server' }, { status: 404 });
            }
            return NextResponse.json({ error: 'Failed to fetch Discord member' }, { status: discordRes.status });
        }

        const member = await discordRes.json();
        const roles = member.roles || [];

        if (roles.includes(roleId)) {
            // 3. Update Subscription Status
            await convex.mutation("users:updateSubscriptionStatus" as any, {
                discordId: user.discordId,
                subscriptionStatus: 'active',
                roleId: roleId,
                secret: process.env.CONVEX_INTERNAL_SECRET || "",
            });
            return NextResponse.json({ status: 'active', updated: true });
        } else {
            return NextResponse.json({ status: 'inactive' });
        }

    } catch (error: any) {
        console.error("Error checking subscription:", error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
