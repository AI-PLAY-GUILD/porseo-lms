import { safeCompare } from "./safeCompare";

/**
 * CONVEX_INTERNAL_SECRET を検証するヘルパー
 * 環境変数未設定の場合はエラーをスローし、空文字比較を防ぐ
 */
export function validateInternalSecret(providedSecret: string): void {
    const expected = process.env.CONVEX_INTERNAL_SECRET;
    if (!expected) {
        throw new Error("Server configuration error: CONVEX_INTERNAL_SECRET is not set");
    }
    if (!safeCompare(providedSecret, expected)) {
        throw new Error("Unauthorized: Invalid secret");
    }
}
