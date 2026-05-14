type RoleUpdate = {
    discordId: string;
    action: "add" | "remove";
};

const DISCORD_TIMEOUT_MS = 10_000;

async function fetchWithTimeout(url: string, init: RequestInit) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DISCORD_TIMEOUT_MS);
    try {
        return await fetch(url, { ...init, signal: controller.signal });
    } finally {
        clearTimeout(timeoutId);
    }
}

export async function grantMembershipDiscordRole(discordId: string, accessToken?: string) {
    const guildId = process.env.DISCORD_GUILD_ID;
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const roleId = process.env.DISCORD_ROLE_ID;

    if (!guildId || !botToken || !roleId) {
        return { ok: false, warning: "Discord configuration missing" };
    }

    if (accessToken) {
        await fetchWithTimeout(`https://discord.com/api/v10/guilds/${guildId}/members/${discordId}`, {
            method: "PUT",
            headers: {
                Authorization: `Bot ${botToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ access_token: accessToken }),
        });
    }

    const roleResponse = await fetchWithTimeout(
        `https://discord.com/api/v10/guilds/${guildId}/members/${discordId}/roles/${roleId}`,
        {
            method: "PUT",
            headers: { Authorization: `Bot ${botToken}` },
        },
    );

    if (!roleResponse.ok) {
        return { ok: false, warning: "Failed to grant Discord role" };
    }

    return { ok: true };
}

export async function applyMembershipRoleUpdates(updates: RoleUpdate[]) {
    const guildId = process.env.DISCORD_GUILD_ID;
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const roleId = process.env.DISCORD_ROLE_ID;

    if (!guildId || !botToken || !roleId) {
        return { applied: 0, failed: updates.length, warning: "Discord configuration missing" };
    }

    let applied = 0;
    let failed = 0;

    for (const update of updates) {
        const method = update.action === "add" ? "PUT" : "DELETE";
        const response = await fetchWithTimeout(
            `https://discord.com/api/v10/guilds/${guildId}/members/${update.discordId}/roles/${roleId}`,
            {
                method,
                headers: { Authorization: `Bot ${botToken}` },
            },
        );

        if (response.ok || response.status === 404) {
            applied++;
        } else {
            failed++;
        }
    }

    return { applied, failed };
}
