import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { convex } from '@/lib/convex';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import Stripe from 'stripe';

// Initialize Discord REST client
const discordToken = process.env.DISCORD_BOT_TOKEN;
const guildId = process.env.DISCORD_GUILD_ID;
const roleId = process.env.DISCORD_ROLE_ID;

if (!discordToken || !guildId || !roleId) {
    console.error('Missing Discord environment variables');
}

const rest = new REST({ version: '10' }).setToken(discordToken || '');

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get('Stripe-Signature') as string;

    let event: Stripe.Event;

    try {
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
            throw new Error('STRIPE_WEBHOOK_SECRET is missing');
        }
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (error: any) {
        console.error(`Webhook signature verification failed: ${error.message}`);
        return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                await handleCheckoutSessionCompleted(session);
                break;
            }
            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice;
                await handleInvoicePaymentFailed(invoice);
                break;
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionDeleted(subscription);
                break;
            }
            default:
                console.log(`Unhandled event type ${event.type}`);
        }
    } catch (error: any) {
        console.error(`Error handling event ${event.type}:`, error);
        return NextResponse.json({ error: 'Error handling event' }, { status: 500 });
    }

    return NextResponse.json({ received: true });
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    const discordId = session.metadata?.discordId;
    const customerId = session.customer as string;

    if (!discordId || !customerId) {
        console.error('Missing discordId or customerId in session metadata/payload');
        return;
    }

    // Action 1: Update Convex DB
    // We use the string identifier for the mutation since we don't have generated types here
    // Changed to "users:..." because internal.ts is private

    // Retrieve the session with line_items expanded to get the product name
    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ['line_items'],
    });

    const lineItem = fullSession.line_items?.data[0];
    const subscriptionName = lineItem?.description || 'Premium Membership';

    await convex.mutation("users:updateSubscriptionStatus" as any, {
        discordId,
        stripeCustomerId: customerId,
        subscriptionStatus: 'active',
        subscriptionName: subscriptionName,
        roleId: roleId, // Pass the role ID to Convex
        secret: process.env.CONVEX_INTERNAL_SECRET || "",
    });


    // Action 2: Add Discord Role
    if (discordToken && guildId && roleId) {
        try {
            await rest.put(Routes.guildMemberRole(guildId, discordId, roleId));
        } catch (error) {
            console.error('Failed to add Discord role:', error);
        }
    }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;
    if (!customerId) return;

    // Action: Update Convex DB
    await convex.mutation("users:updateSubscriptionStatusByCustomerId" as any, {
        stripeCustomerId: customerId,
        subscriptionStatus: 'past_due',
        secret: process.env.CONVEX_INTERNAL_SECRET || "",
    });

    // TODO: Optionally send a DM to notify user about payment failure
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;
    if (!customerId) return;

    // Action: Update Convex DB
    await convex.mutation("users:updateSubscriptionStatusByCustomerId" as any, {
        stripeCustomerId: customerId,
        subscriptionStatus: 'canceled',
        secret: process.env.CONVEX_INTERNAL_SECRET || "",
    });

    // Remove Discord Role using user's discordId from Convex

    try {
        const user = await convex.query("users:getUserByStripeCustomerId" as any, {
            stripeCustomerId: customerId,
            secret: process.env.CONVEX_INTERNAL_SECRET || "",
        });

        if (user && user.discordId && discordToken && guildId && roleId) {
            await rest.delete(Routes.guildMemberRole(guildId, user.discordId, roleId));
        }
    } catch (e) {
        console.error("Failed to remove role or find user:", e);
    }
}
