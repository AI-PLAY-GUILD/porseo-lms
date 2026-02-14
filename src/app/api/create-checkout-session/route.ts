import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { convex } from '@/lib/convex';
import { api } from '../../../../convex/_generated/api';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: Request) {
    try {
        if (!process.env.NEXT_PUBLIC_BASE_URL) {
            console.error('NEXT_PUBLIC_BASE_URL is not set');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch user from Convex to get Stripe Customer ID and Discord ID
        let stripeCustomerId: string | undefined;
        let discordId: string | undefined;

        try {
            const user = await convex.query(api.users.getUserByClerkIdQuery, { clerkId: userId });
            if (user) {
                stripeCustomerId = user.stripeCustomerId;
                discordId = user.discordId;
            }
        } catch (error) {
            console.error('Error fetching user from Convex:', error);
            return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        }

        if (!discordId) {
            return NextResponse.json({ error: 'Discord account not linked. Please link your account first.' }, { status: 400 });
        }

        const sessionParams: any = {
            payment_method_types: ['card'],
            line_items: [
                {
                    price: process.env.STRIPE_PRICE_ID!,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/?payment=success`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
            metadata: {
                discordId: discordId, // Use trusted Discord ID from DB
                userId: userId || '',
            },
        };

        if (stripeCustomerId) {
            sessionParams.customer = stripeCustomerId;
        }

        const session = await stripe.checkout.sessions.create(sessionParams);

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error('Error creating checkout session:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
