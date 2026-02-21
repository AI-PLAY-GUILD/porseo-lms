import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { convex } from '@/lib/convex';
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

        // Get user from Convex to find Stripe Customer ID
        // biome-ignore lint/suspicious/noExplicitAny: ConvexHttpClient requires string function reference
        const user = await convex.query("users:getUserByClerkIdServer" as any, {
            clerkId: userId,
            secret: process.env.CONVEX_INTERNAL_SECRET || "",
        });

        if (!user || !user.stripeCustomerId) {
            return NextResponse.json({ error: 'No billing information found' }, { status: 404 });
        }

        // Create Portal Session
        const session = await stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/profile`,
        });

        return NextResponse.json({ url: session.url });
    } catch (error: unknown) {
        console.error('Error creating portal session:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
