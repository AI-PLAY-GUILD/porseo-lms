/**
 * 必須環境変数を安全に取得するヘルパー
 * 未設定の場合はエラーをスローし、空文字フォールバックによるセキュリティリスクを防ぐ
 */
export function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

/**
 * CONVEX_INTERNAL_SECRET を安全に取得
 */
export function getConvexInternalSecret(): string {
    return requireEnv("CONVEX_INTERNAL_SECRET");
}
