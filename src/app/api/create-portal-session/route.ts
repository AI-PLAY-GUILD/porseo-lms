import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { convex } from "@/lib/convex";
import { getConvexInternalSecret } from "@/lib/env";
import { getStripe } from "@/lib/stripe";
import { api } from "../../../../convex/_generated/api";

export async function POST(req: Request) {
    console.log("[create-portal-session] リクエスト受信", { method: "POST" });
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;

        const { userId } = await auth();
        if (!userId) {
            console.log("[create-portal-session] 認証失敗: userId が存在しません");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user from Convex to find Stripe Customer ID
        const user = await convex.query(api.users.getUserByClerkIdServer, {
            clerkId: userId,
            secret: getConvexInternalSecret(),
        });

        if (!user || !user.stripeCustomerId) {
            console.log("[create-portal-session] 請求情報が見つかりません", { userId });
            return NextResponse.json({ error: "No billing information found" }, { status: 404 });
        }

        const stripe = getStripe();
        const returnUrl = `${baseUrl}/profile`;
        const subscriptions = await stripe.subscriptions.list({
            customer: user.stripeCustomerId,
            status: "all",
            limit: 20,
        });
        const targetSubscription = subscriptions.data.find((sub) =>
            ["active", "trialing", "past_due", "unpaid"].includes(sub.status),
        );

        let session;
        if (targetSubscription) {
            try {
                session = await stripe.billingPortal.sessions.create({
                    customer: user.stripeCustomerId,
                    return_url: returnUrl,
                    flow_data: {
                        type: "subscription_update",
                        subscription_update: {
                            subscription: targetSubscription.id,
                        },
                    },
                });
            } catch (flowError) {
                console.warn("[create-portal-session] subscription_update フローの作成に失敗。通常ポータルへフォールバック", {
                    customerId: user.stripeCustomerId,
                    subscriptionId: targetSubscription.id,
                    flowError,
                });
                session = await stripe.billingPortal.sessions.create({
                    customer: user.stripeCustomerId,
                    return_url: returnUrl,
                });
            }
        } else {
            session = await stripe.billingPortal.sessions.create({
                customer: user.stripeCustomerId,
                return_url: returnUrl,
            });
        }

        console.log("[create-portal-session] 成功: ポータルセッション作成完了", { customerId: user.stripeCustomerId });
        return NextResponse.json({ url: session.url });
    } catch (error: unknown) {
        console.error("[create-portal-session] エラー:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
