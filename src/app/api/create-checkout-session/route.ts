import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { convex } from '@/lib/convex';
import { api } from '../../../../convex/_generated/api';

export async function POST(req: Request) {
    try {
        const { discordId, userId } = await req.json();

        if (!discordId) {
            return NextResponse.json({ error: 'Missing discordId' }, { status: 400 });
        }

        // Fetch user from Convex to get Stripe Customer ID
        let stripeCustomerId: string | undefined;
        if (userId) {
            try {
                const user = await convex.query(api.users.getUserByClerkIdQuery, { clerkId: userId });
                if (user?.stripeCustomerId) {
                    stripeCustomerId = user.stripeCustomerId;
                }
            } catch (error) {
                console.error('Error fetching user from Convex:', error);
            }
        }

        const sessionParams: any = {
            payment_method_types: ['card'],
            line_items: [
                {
                    price: 'price_1Sh8jc097600wFiQBljFwC9N',
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/?payment=success`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
            metadata: {
                discordId,
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
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
