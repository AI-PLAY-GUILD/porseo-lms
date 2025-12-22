import { NextResponse } from 'next/server';
import { convex } from '@/lib/convex';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { auth } from '@clerk/nextjs/server';

const discordToken = process.env.DISCORD_BOT_TOKEN;
const guildId = process.env.DISCORD_GUILD_ID;
const roleId = process.env.DISCORD_ROLE_ID;

const rest = new REST({ version: '10' }).setToken(discordToken || '');

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Get user from Convex to check subscription and Discord ID
        const user = await convex.query("users:getUserByClerkId" as any, { clerkId: userId });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (user.subscriptionStatus !== 'active') {
            return NextResponse.json({ error: 'Subscription not active' }, { status: 403 });
        }

        if (!user.discordId) {
            return NextResponse.json({ error: 'Discord ID not linked' }, { status: 400 });
        }

        // 2. Try to add role
        if (discordToken && guildId && roleId) {
            try {
                await rest.put(Routes.guildMemberRole(guildId, user.discordId, roleId));
                console.log(`Manually added role ${roleId} to user ${user.discordId}`);
                return NextResponse.json({ success: true });
            } catch (error: any) {
                console.error('Failed to add Discord role:', error);
                // 404 means user is not in the server
                if (error.status === 404) {
                    return NextResponse.json({ error: 'User not in Discord server. Please join first.' }, { status: 404 });
                }
                return NextResponse.json({ error: 'Failed to assign role' }, { status: 500 });
            }
        } else {
            return NextResponse.json({ error: 'Discord configuration missing' }, { status: 500 });
        }

    } catch (error: any) {
        console.error('Error syncing role:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
