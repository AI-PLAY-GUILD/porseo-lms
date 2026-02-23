import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { convex } from "@/lib/convex";
import { stripe } from "@/lib/stripe";
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
    const body = await req.text();
    const signature = (await headers()).get("Stripe-Signature") as string;

    let event: Stripe.Event;

    try {
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
            throw new Error("STRIPE_WEBHOOK_SECRET is missing");
        }
        event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (error: unknown) {
        console.error(
            `Webhook signature verification failed: ${error instanceof Error ? error.message : String(error)}`,
        );
        return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
    }

    // Idempotency check (Issue #53): Skip already-processed events
    try {
        const alreadyProcessed = await convex.query(api.users.checkStripeEventProcessed, {
            eventId: event.id,
            secret: process.env.CONVEX_INTERNAL_SECRET || "",
        });
        if (alreadyProcessed) {
            return NextResponse.json({ received: true, duplicate: true });
        }
    } catch (error) {
        console.error("Idempotency check failed, proceeding with event processing:", error);
    }

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
        console.error(`Error handling event ${event.type}:`, error);
        return NextResponse.json({ error: "Error handling event" }, { status: 500 });
    }

    // Mark event as processed (Issue #53)
    try {
        await convex.mutation(api.users.markStripeEventProcessed, {
            eventId: event.id,
            eventType: event.type,
            secret: process.env.CONVEX_INTERNAL_SECRET || "",
        });
    } catch (error) {
        console.error("Failed to mark event as processed:", error);
    }

    return NextResponse.json({ received: true });
}

// Discord ID format validation (17-20 digit snowflake)
function isValidDiscordId(id: string): boolean {
    return /^\d{17,20}$/.test(id);
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    const clerkUserId = session.metadata?.userId;
    const customerId = session.customer as string;

    if (!clerkUserId || !customerId) {
        console.error("Missing userId or customerId in session metadata/payload");
        return;
    }

    // Security fix (Issue #48): Fetch discordId from DB instead of trusting metadata
    let discordId: string | undefined;
    try {
        const user = await convex.query(api.users.getUserByClerkIdServer, {
            clerkId: clerkUserId,
            secret: process.env.CONVEX_INTERNAL_SECRET || "",
        });
        discordId = user?.discordId;
    } catch (error) {
        console.error("Error fetching user from Convex:", error);
        return;
    }

    if (!discordId || !isValidDiscordId(discordId)) {
        console.error("User has no valid discordId in DB");
        return;
    }

    // Retrieve the session with line_items expanded to get the product name
    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
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
        secret: process.env.CONVEX_INTERNAL_SECRET || "",
    });

    // Add Discord Role
    if (discordToken && guildId && roleId) {
        try {
            await rest.put(Routes.guildMemberRole(guildId, discordId, roleId));
        } catch (error) {
            console.error("Failed to add Discord role:", error);
        }
    }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;
    if (!customerId) return;

    // Action: Update Convex DB
    await convex.mutation(api.users.updateSubscriptionStatusByCustomerId, {
        stripeCustomerId: customerId,
        subscriptionStatus: "past_due",
        secret: process.env.CONVEX_INTERNAL_SECRET || "",
    });

    // Issue #58: Send Discord DM to notify user about payment failure
    try {
        const user = await convex.query(api.users.getUserByStripeCustomerId, {
            stripeCustomerId: customerId,
            secret: process.env.CONVEX_INTERNAL_SECRET || "",
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
    const customerId = subscription.customer as string;
    if (!customerId) return;

    // Action: Update Convex DB
    await convex.mutation(api.users.updateSubscriptionStatusByCustomerId, {
        stripeCustomerId: customerId,
        subscriptionStatus: "canceled",
        secret: process.env.CONVEX_INTERNAL_SECRET || "",
    });

    // Remove Discord Role using user's discordId from Convex

    try {
        const user = await convex.query(api.users.getUserByStripeCustomerId, {
            stripeCustomerId: customerId,
            secret: process.env.CONVEX_INTERNAL_SECRET || "",
        });

        if (user?.discordId && discordToken && guildId && roleId) {
            await rest.delete(Routes.guildMemberRole(guildId, user.discordId, roleId));
        }
    } catch (e) {
        console.error("Failed to remove role or find user:", e);
    }
}
