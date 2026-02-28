import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { convex } from "@/lib/convex";
import { getConvexInternalSecret } from "@/lib/env";
import { stripe } from "@/lib/stripe";
import { api } from "../../../../convex/_generated/api";

export async function POST(_req: Request) {
    console.log("[create-portal-session] リクエスト受信", { method: "POST" });
    try {
        if (!process.env.NEXT_PUBLIC_BASE_URL) {
            console.error("NEXT_PUBLIC_BASE_URL is not set");
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }

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

        // Create Portal Session
        const session = await stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/profile`,
        });

        console.log("[create-portal-session] 成功: ポータルセッション作成完了", { customerId: user.stripeCustomerId });
        return NextResponse.json({ url: session.url });
    } catch (error: unknown) {
        console.error("[create-portal-session] エラー:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
