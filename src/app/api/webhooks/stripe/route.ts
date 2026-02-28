import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { convex } from "@/lib/convex";
import { getConvexInternalSecret } from "@/lib/env";
import { getStripe } from "@/lib/stripe";
import { api } from "../../../../../convex/_generated/api";

// Initialize Discord REST client
const discordToken = process.env.DISCORD_BOT_TOKEN;
const guildId = process.env.DISCORD_GUILD_ID;
const roleId = process.env.DISCORD_ROLE_ID;

if (!discordToken || !guildId || !roleId) {
    console.error("Missing Discord environment variables");
}

// Issue #56: Add timeout to Discord REST client
const rest = new REST({ version: "10", timeout: 10_000 }).setToken(discordToken || "");

export async function POST(req: Request) {
    console.log("[webhooks/stripe] リクエスト受信", { method: "POST" });
    const body = await req.text();
    const signature = (await headers()).get("Stripe-Signature") as string;

    let event: Stripe.Event;

    try {
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
            throw new Error("STRIPE_WEBHOOK_SECRET is missing");
        }
        event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (error: unknown) {
        console.error(
            `[webhooks/stripe] エラー: Webhook署名検証失敗: ${error instanceof Error ? error.message : String(error)}`,
        );
        return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
    }

    // Idempotency check (Issue #53): Skip already-processed events
    try {
        const alreadyProcessed = await convex.query(api.users.checkStripeEventProcessed, {
            eventId: event.id,
            secret: getConvexInternalSecret(),
        });
        if (alreadyProcessed) {
            console.log("[webhooks/stripe] 重複イベントをスキップ", { eventId: event.id });
            return NextResponse.json({ received: true, duplicate: true });
        }
    } catch (error) {
        console.error("Idempotency check failed, proceeding with event processing:", error);
    }

    console.log("[webhooks/stripe] イベント処理開始", { eventType: event.type, eventId: event.id });

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;
                await handleCheckoutSessionCompleted(session);
                break;
            }
            case "invoice.payment_failed": {
                const invoice = event.data.object as Stripe.Invoice;
                await handleInvoicePaymentFailed(invoice);
                break;
            }
            case "customer.subscription.deleted": {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionDeleted(subscription);
                break;
            }
            default:
                console.log(`Unhandled event type ${event.type}`);
        }
    } catch (error: unknown) {
        console.error(`[webhooks/stripe] エラー: イベント処理失敗 ${event.type}:`, error);
        return NextResponse.json({ error: "Error handling event" }, { status: 500 });
    }

    // Mark event as processed (Issue #53)
    try {
        await convex.mutation(api.users.markStripeEventProcessed, {
            eventId: event.id,
            eventType: event.type,
            secret: getConvexInternalSecret(),
        });
    } catch (error) {
        console.error("Failed to mark event as processed:", error);
    }

    console.log("[webhooks/stripe] 成功: イベント処理完了", { eventType: event.type, eventId: event.id });
    return NextResponse.json({ received: true });
}

// Discord ID format validation (17-20 digit snowflake)
function isValidDiscordId(id: string): boolean {
    return /^\d{17,20}$/.test(id);
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    console.log("[webhooks/stripe] handleCheckoutSessionCompleted 開始", { sessionId: session.id });
    const clerkUserId = session.metadata?.userId;
    const customerId = session.customer as string;

    if (!clerkUserId || !customerId) {
        console.error("[webhooks/stripe] エラー: セッションメタデータにuserIdまたはcustomerIdが不足");
        return;
    }

    // Security fix (Issue #48): Fetch discordId from DB instead of trusting metadata
    let discordId: string | undefined;
    try {
        const user = await convex.query(api.users.getUserByClerkIdServer, {
            clerkId: clerkUserId,
            secret: getConvexInternalSecret(),
        });
        discordId = user?.discordId;
    } catch (error) {
        console.error("[webhooks/stripe] エラー: Convexからユーザー取得失敗:", error);
        return;
    }

    if (!discordId || !isValidDiscordId(discordId)) {
        console.error("[webhooks/stripe] エラー: 有効なdiscordIdがDBに存在しません", { clerkUserId });
        return;
    }

    // Retrieve the session with line_items expanded to get the product name
    const fullSession = await getStripe().checkout.sessions.retrieve(session.id, {
        expand: ["line_items"],
    });

    const lineItem = fullSession.line_items?.data[0];
    const subscriptionName = lineItem?.description || "Premium Membership";

    await convex.mutation(api.users.updateSubscriptionStatus, {
        discordId,
        stripeCustomerId: customerId,
        subscriptionStatus: "active",
        subscriptionName: subscriptionName,
        roleId: roleId,
        secret: getConvexInternalSecret(),
    });

    console.log("[webhooks/stripe] handleCheckoutSessionCompleted: サブスクリプション更新完了", {
        discordId,
        customerId,
    });

    // Add Discord Role
    if (discordToken && guildId && roleId) {
        try {
            await rest.put(Routes.guildMemberRole(guildId, discordId, roleId));
            console.log("[webhooks/stripe] Discordロール付与成功", { discordId });
        } catch (error) {
            console.error("[webhooks/stripe] エラー: Discordロール付与失敗:", error);
        }
    }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    console.log("[webhooks/stripe] handleInvoicePaymentFailed 開始", { invoiceId: invoice.id });
    const customerId = invoice.customer as string;
    if (!customerId) {
        console.log("[webhooks/stripe] customerIdが不足、スキップ");
        return;
    }

    // Action: Update Convex DB
    await convex.mutation(api.users.updateSubscriptionStatusByCustomerId, {
        stripeCustomerId: customerId,
        subscriptionStatus: "past_due",
        secret: getConvexInternalSecret(),
    });

    // Issue #58: Send Discord DM to notify user about payment failure
    try {
        const user = await convex.query(api.users.getUserByStripeCustomerId, {
            stripeCustomerId: customerId,
            secret: getConvexInternalSecret(),
        });

        if (user?.discordId && discordToken) {
            // Create DM channel
            const dmChannel = (await rest.post("/users/@me/channels", {
                body: { recipient_id: user.discordId },
            })) as { id: string };

            // Send notification message
            await rest.post(`/channels/${dmChannel.id}/messages`, {
                body: {
                    content: [
                        "⚠️ **お支払いに問題が発生しました**",
                        "",
                        "サブスクリプションの決済に失敗しました。",
                        "お支払い情報をご確認の上、再度お試しください。",
                        "",
                        "ご不明な点がございましたら、サポートまでお問い合わせください。",
                    ].join("\n"),
                },
            });
        }
    } catch (e) {
        console.error("[Stripe Webhook] Failed to send payment failure DM:", e);
    }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    console.log("[webhooks/stripe] handleSubscriptionDeleted 開始", { subscriptionId: subscription.id });
    const customerId = subscription.customer as string;
    if (!customerId) {
        console.log("[webhooks/stripe] customerIdが不足、スキップ");
        return;
    }

    // Action: Update Convex DB
    await convex.mutation(api.users.updateSubscriptionStatusByCustomerId, {
        stripeCustomerId: customerId,
        subscriptionStatus: "canceled",
        secret: getConvexInternalSecret(),
    });

    // Remove Discord Role using user's discordId from Convex

    try {
        const user = await convex.query(api.users.getUserByStripeCustomerId, {
            stripeCustomerId: customerId,
            secret: getConvexInternalSecret(),
        });

        if (user?.discordId && discordToken && guildId && roleId) {
            await rest.delete(Routes.guildMemberRole(guildId, user.discordId, roleId));
        }
    } catch (e) {
        console.error("[webhooks/stripe] エラー: ロール削除またはユーザー検索失敗:", e);
    }
    console.log("[webhooks/stripe] handleSubscriptionDeleted 完了", { customerId });
}
