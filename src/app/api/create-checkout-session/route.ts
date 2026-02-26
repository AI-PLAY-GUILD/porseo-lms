import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { convex } from "@/lib/convex";
import { stripe } from "@/lib/stripe";
import { api } from "../../../../convex/_generated/api";

export async function POST(_req: Request) {
    console.log("[create-checkout-session] リクエスト受信", { method: "POST" });
    try {
        if (!process.env.NEXT_PUBLIC_BASE_URL) {
            console.error("NEXT_PUBLIC_BASE_URL is not set");
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }

        const { userId } = await auth();
        if (!userId) {
            console.log("[create-checkout-session] 認証失敗: userId が存在しません");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch user from Convex to get Stripe Customer ID and Discord ID
        let stripeCustomerId: string | undefined;
        let discordId: string | undefined;

        try {
            const user = await convex.query(api.users.getUserByClerkIdServer, {
                clerkId: userId,
                secret: process.env.CONVEX_INTERNAL_SECRET || "",
            });
            if (user) {
                stripeCustomerId = user.stripeCustomerId;
                discordId = user.discordId;
            }
        } catch (error) {
            console.error("[create-checkout-session] エラー: Convexからユーザー取得失敗:", error);
            return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
        }

        if (!discordId) {
            console.log("[create-checkout-session] Discord未連携", { userId });
            return NextResponse.json(
                { error: "Discord account not linked. Please link your account first." },
                { status: 400 },
            );
        }

        const sessionParams: Stripe.Checkout.SessionCreateParams = {
            payment_method_types: ["card"],
            line_items: [
                {
                    price: process.env.STRIPE_PRICE_ID!,
                    quantity: 1,
                },
            ],
            mode: "subscription",
            success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/?payment=success`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
            metadata: {
                discordId: discordId, // Use trusted Discord ID from DB
                userId: userId || "",
            },
            ...(stripeCustomerId ? { customer: stripeCustomerId } : {}),
        };

        const session = await stripe.checkout.sessions.create(sessionParams);

        console.log("[create-checkout-session] 成功: セッション作成完了", { sessionId: session.id });
        return NextResponse.json({ url: session.url });
    } catch (error: unknown) {
        console.error("[create-checkout-session] エラー:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
