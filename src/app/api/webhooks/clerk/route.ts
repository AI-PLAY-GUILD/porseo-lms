import type { WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { Webhook } from "svix";
import { convex } from "@/lib/convex";
import { api } from "../../../../../convex/_generated/api";

export async function POST(req: Request) {
    console.log("[webhooks/clerk] リクエスト受信", { method: "POST" });
    // You can find this in the Clerk Dashboard -> Webhooks -> choose the endpoint
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        console.error("[webhooks/clerk] エラー: CLERK_WEBHOOK_SECRET が未設定");
        throw new Error("Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local");
    }

    // Get the headers
    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
        console.log("[webhooks/clerk] svixヘッダーが不足しています");
        return new Response("Error occured -- no svix headers", {
            status: 400,
        });
    }

    // Get the body
    const payload = await req.json();
    const body = JSON.stringify(payload);

    // Create a new Svix instance with your secret.
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: WebhookEvent;

    // Verify the payload with the headers
    try {
        evt = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        }) as WebhookEvent;
    } catch (err) {
        console.error("[webhooks/clerk] エラー: webhook検証失敗:", err);
        return new Response("Error occured", {
            status: 400,
        });
    }

    // Do something with the payload
    // For this guide, you simply log the payload to the console
    const { id } = evt.data;
    const eventType = evt.type;
    // Webhook body/ID log removed for security (Issue #13, #29)

    console.log("[webhooks/clerk] イベント受信", { eventType, eventId: id });

    if (eventType === "user.created" || eventType === "user.updated") {
        const { id, email_addresses, first_name, last_name, image_url } = evt.data;

        if (!id || !email_addresses || email_addresses.length === 0) {
            console.log("[webhooks/clerk] 必須データ不足", { eventType });
            return new Response("Error occured -- missing data", {
                status: 400,
            });
        }

        const email = email_addresses[0].email_address;
        const name = `${first_name || ""} ${last_name || ""}`.trim() || "Anonymous";

        try {
            await convex.mutation(api.users.webhookSyncUser, {
                clerkId: id,
                email: email,
                name: name,
                imageUrl: image_url,
                secret: process.env.CLERK_WEBHOOK_SECRET!,
            });
        } catch (error) {
            console.error("[webhooks/clerk] エラー: Convexへのユーザー同期失敗:", error);
            return new Response("Error syncing user to Convex", {
                status: 500,
            });
        }
    }

    console.log("[webhooks/clerk] 成功: イベント処理完了", { eventType });
    return new Response("", { status: 200 });
}
