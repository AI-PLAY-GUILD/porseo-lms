import { ConvexHttpClient } from "convex/browser";

let _convex: ConvexHttpClient | undefined;

/**
 * Convex HTTP クライアントを遅延初期化で取得
 * ビルド時ではなくランタイムでのみ環境変数を検証する
 */
function getConvexClient(): ConvexHttpClient {
    if (!_convex) {
        const convexUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
        if (!convexUrl) {
            throw new Error(
                "CONVEX_URL or NEXT_PUBLIC_CONVEX_URL is missing. Please set it in your environment variables.",
            );
        }
        _convex = new ConvexHttpClient(convexUrl);
    }
    return _convex;
}

// Proxy を使ってランタイムまで初期化を遅延させつつ、既存の `convex` インポートとの互換性を維持
export const convex: ConvexHttpClient = new Proxy({} as ConvexHttpClient, {
    get(_, prop, receiver) {
        return Reflect.get(getConvexClient(), prop, receiver);
    },
});
