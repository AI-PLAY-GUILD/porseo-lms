import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
    try {
        const { discordId, userId } = await req.json();

        if (!discordId) {
            return NextResponse.json({ error: 'Missing discordId' }, { status: 400 });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    // Replace with your actual price ID or create a product on the fly (not recommended for prod)
                    // For now, I'll use a placeholder or assume the user provides it via env or it's hardcoded.
                    // The prompt didn't specify a price ID, so I'll add a comment.
                    price_data: {
                        currency: 'jpy',
                        product_data: {
                            name: 'Premium Membership',
                        },
                        unit_amount: 980,
                        recurring: {
                            interval: 'month',
                        },
                    },
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/?payment=success`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
            metadata: {
                discordId,
                userId: userId || '', // Optional
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error('Error creating checkout session:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
