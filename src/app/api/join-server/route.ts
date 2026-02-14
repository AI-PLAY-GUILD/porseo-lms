import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const client = await clerkClient();

        // 1. Get User to find Discord ID
        const user = await client.users.getUser(userId);
        const discordAccount = user.externalAccounts.find(
            (acc) => acc.provider === 'oauth_discord' || acc.provider === 'discord'
        );

        if (!discordAccount || !(discordAccount as any).providerUserId) {
            return NextResponse.json({ error: 'Discord account not linked' }, { status: 400 });
        }

        const discordUserId = (discordAccount as any).providerUserId;

        // 2. Get Discord Access Token
        const response = await client.users.getUserOauthAccessToken(userId, 'oauth_discord');

        if (!response.data || response.data.length === 0) {
            return NextResponse.json({ error: 'No Discord access token found' }, { status: 400 });
        }

        const accessToken = response.data[0].token;

        // 3. Add to Discord Server
        const guildId = process.env.DISCORD_GUILD_ID;
        const botToken = process.env.DISCORD_BOT_TOKEN;

        if (!guildId || !botToken) {
            console.error("Missing Discord env vars");
            return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
        }

        // Discord API: PUT /guilds/{guild.id}/members/{user.id}
        const discordRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bot ${botToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                access_token: accessToken,
            }),
        });

        if (discordRes.ok || discordRes.status === 201 || discordRes.status === 204) {
            console.log(`Successfully added user ${discordUserId} to server`);
            return NextResponse.json({ success: true });
        } else {
            const errorText = await discordRes.text();
            console.error("Discord API Error:", errorText);
            // Ignore "Already in server" errors if needed, but usually 204 or 201 covers success.
            // If user is already in server, it might return 204.
            return NextResponse.json({ error: 'Failed to join server', details: errorText }, { status: discordRes.status });
        }

    } catch (error: any) {
        console.error("Error joining server:", error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
