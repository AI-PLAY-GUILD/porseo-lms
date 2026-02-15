/**
 * Constant-time string comparison to prevent timing attacks on secret verification.
 * Convex V8 isolate doesn't have crypto.timingSafeEqual, so we use a pure JS implementation.
 */
export function safeCompare(a: string, b: string): boolean {
    const len = Math.max(a.length, b.length);
    let result = a.length ^ b.length;
    for (let i = 0; i < len; i++) {
        result |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
    }
    return result === 0;
}
