import { NextResponse } from 'next/server';
import { convex } from '@/lib/convex';
import { auth } from '@clerk/nextjs/server';

const discordToken = process.env.DISCORD_BOT_TOKEN;
const guildId = process.env.DISCORD_GUILD_ID;
const roleId = process.env.DISCORD_ROLE_ID;

// Issue #62: In-memory Discord role cache to reduce API calls
const roleCache = new Map<string, { roles: string[]; cachedAt: number }>();
const ROLE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedRoles(discordId: string): string[] | null {
    const entry = roleCache.get(discordId);
    if (!entry) return null;
    if (Date.now() - entry.cachedAt > ROLE_CACHE_TTL) {
        roleCache.delete(discordId);
        return null;
    }
    return entry.roles;
}

function setCachedRoles(discordId: string, roles: string[]) {
    // Lazy cleanup when cache grows too large
    if (roleCache.size > 5000) {
        const now = Date.now();
        for (const [key, val] of roleCache) {
            if (now - val.cachedAt > ROLE_CACHE_TTL) roleCache.delete(key);
        }
    }
    roleCache.set(discordId, { roles, cachedAt: Date.now() });
}

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

        // Issue #62: Check cache first before calling Discord API
        let roles: string[];
        const cachedRoles = getCachedRoles(user.discordId);

        if (cachedRoles) {
            roles = cachedRoles;
        } else {
            // Issue #56: Add timeout to Discord API call
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            let discordRes: Response;
            try {
                discordRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${user.discordId}`, {
                    headers: {
                        'Authorization': `Bot ${discordToken}`,
                    },
                    signal: controller.signal,
                });
            } finally {
                clearTimeout(timeoutId);
            }

            if (!discordRes.ok) {
                const errorText = await discordRes.text();
                console.error("Discord API Error:", errorText);
                if (discordRes.status === 404) {
                    return NextResponse.json({ error: 'User not in Discord server' }, { status: 404 });
                }
                // Issue #57: Sanitize error response — don't expose Discord status code
                return NextResponse.json({ error: 'Failed to fetch Discord member' }, { status: 502 });
            }

            const member = await discordRes.json();
            roles = member.roles || [];
            setCachedRoles(user.discordId, roles);
        }

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
        // Issue #56: Handle timeout errors
        if (error.name === 'AbortError') {
            return NextResponse.json({ error: 'External service timeout' }, { status: 504 });
        }
        console.error("Error checking subscription:", error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
