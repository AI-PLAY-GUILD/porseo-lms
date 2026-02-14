/**
 * Zoom Server-to-Server OAuth utility
 * Used for future extensions (e.g., fetching recordings list, delayed transcript retrieval)
 * Current implementation uses download_token from webhook payload instead.
 */

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getZoomAccessToken(): Promise<string> {
    // Return cached token if still valid (with 60s buffer)
    if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
        return cachedToken.token;
    }

    const accountId = process.env.ZOOM_ACCOUNT_ID;
    const clientId = process.env.ZOOM_CLIENT_ID;
    const clientSecret = process.env.ZOOM_CLIENT_SECRET;

    if (!accountId || !clientId || !clientSecret) {
        throw new Error("Missing Zoom OAuth credentials (ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET)");
    }

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch('https://zoom.us/oauth/token', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'account_credentials',
            account_id: accountId,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Zoom OAuth token request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    cachedToken = {
        token: data.access_token,
        expiresAt: Date.now() + (data.expires_in * 1000),
    };

    return data.access_token;
}
