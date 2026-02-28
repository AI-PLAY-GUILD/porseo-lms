import Stripe from "stripe";

let _stripe: Stripe | undefined;

/**
 * Stripe クライアントを遅延初期化で取得
 * ビルド時ではなくランタイムでのみ環境変数を検証する
 */
export function getStripe(): Stripe {
    if (!_stripe) {
        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error("STRIPE_SECRET_KEY is missing. Please set it in your environment variables.");
        }
        _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            typescript: true,
        });
    }
    return _stripe;
}
