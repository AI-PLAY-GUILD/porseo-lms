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

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const response = await fetch("https://zoom.us/oauth/token", {
        method: "POST",
        headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            grant_type: "account_credentials",
            account_id: accountId,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("[zoom] トークン取得失敗:", response.status, errorText);
        throw new Error(`Zoom OAuth token request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    cachedToken = {
        token: data.access_token,
        expiresAt: Date.now() + data.expires_in * 1000,
    };

    return data.access_token;
}

/**
 * Zoom共有録画URL（/rec/share/...）からミーティングIDを抽出する。
 * HTMLページをfetchしてメタデータや埋め込みスクリプトからIDを探す。
 * SSRF防止: zoom.usドメインのみ許可。
 * 抽出失敗時はnullを返す（例外は投げない）。
 */
export async function resolveShareUrl(shareUrl: string): Promise<string | null> {
    try {
        const parsed = new URL(shareUrl);
        if (!parsed.hostname.endsWith(".zoom.us")) {
            console.warn("[zoom] resolveShareUrl: 非zoom.usドメイン:", parsed.hostname);
            return null;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10_000);

        try {
            const res = await fetch(shareUrl, {
                signal: controller.signal,
                headers: {
                    "User-Agent": "Mozilla/5.0 (compatible; PORSEO-LMS/1.0)",
                },
                redirect: "follow",
            });
            clearTimeout(timeout);

            if (!res.ok) {
                console.warn("[zoom] resolveShareUrl: HTTPエラー:", res.status);
                return null;
            }

            const html = await res.text();

            // パターン1: meetingId in JSON-like structures (e.g., "meetingId":"12345678901" or meetingId: 12345678901)
            const jsonMatch = html.match(/["']?meetingId["']?\s*[:=]\s*["']?(\d{9,11})["']?/i);
            if (jsonMatch) return jsonMatch[1];

            // パターン2: /j/ URL embedded in the page
            const urlMatch = html.match(/zoom\.us\/j\/(\d{9,11})/);
            if (urlMatch) return urlMatch[1];

            // パターン3: meeting_number or meetingNumber
            const numMatch = html.match(/["']?meeting[_]?[Nn]umber["']?\s*[:=]\s*["']?(\d{9,11})["']?/i);
            if (numMatch) return numMatch[1];

            // パターン4: fileId containing meeting info (UUID pattern not useful for API, skip)

            console.warn("[zoom] resolveShareUrl: ミーティングID抽出失敗");
            return null;
        } catch (fetchErr) {
            clearTimeout(timeout);
            if (fetchErr instanceof DOMException && fetchErr.name === "AbortError") {
                console.warn("[zoom] resolveShareUrl: タイムアウト");
            } else {
                console.warn("[zoom] resolveShareUrl: fetchエラー:", fetchErr);
            }
            return null;
        }
    } catch {
        console.warn("[zoom] resolveShareUrl: URL解析エラー");
        return null;
    }
}
