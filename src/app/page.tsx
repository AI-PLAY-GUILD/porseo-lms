"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";
import { StripeLinkModal } from "@/components/stripe-link-modal";
import { BrutalistHeader } from "@/components/landing/BrutalistHeader";
import { BrutalistHero } from "@/components/landing/BrutalistHero";
import { BrutalistFeatures } from "@/components/landing/BrutalistFeatures";
import { BrutalistPricing } from "@/components/landing/BrutalistPricing";
import { BrutalistFooter } from "@/components/landing/BrutalistFooter";
import { BackToTop } from "@/components/landing/back-to-top";

export default function Home() {
    const { isSignedIn, user, isLoaded } = useUser();
    const userData = useQuery(api.users.getUser);
    const storeUser = useMutation(api.users.storeUser);

    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [isSynced, setIsSynced] = useState(false);

    // Sync User & Auto-Join
    useEffect(() => {
        const sync = async () => {
            if (!isLoaded || !isSignedIn || !user || isSynced) return;

            try {
                const discordAccount = user.externalAccounts.find(
                    (acc) => (acc.provider as string) === 'oauth_discord' || (acc.provider as string) === 'discord'
                );
                const discordId = discordAccount?.providerUserId;

                // Store User with Discord ID
                await storeUser({
                    clerkId: user.id,
                    email: user.primaryEmailAddress?.emailAddress || "",
                    name: user.fullName || user.username || "Unknown",
                    imageUrl: user.imageUrl,
                    discordId: discordId,
                });

                // Auto-join Discord Server
                try {
                    await fetch('/api/join-server', { method: 'POST' });
                } catch (e) {
                    console.error("Failed to auto-join server:", e);
                }

                // Check Subscription (Role Sync)
                try {
                    await fetch('/api/check-subscription', { method: 'POST' });
                } catch (e) {
                    console.error("Failed to check subscription:", e);
                }

                setIsSynced(true);
            } catch (error) {
                console.error("Failed to sync user:", error);
            }
        };

        sync();
    }, [isLoaded, isSignedIn, user, isSynced, storeUser]);

    const handleCheckout = async () => {
        setCheckoutLoading(true);
        try {
            const discordAccount = user?.externalAccounts.find(
                (acc) => (acc.provider as string) === 'oauth_discord' || (acc.provider as string) === 'discord'
            );
            const discordId = discordAccount?.providerUserId;

            if (!discordId) {
                console.error("Discord ID not found");
                alert("Discord IDが見つかりません。もう一度ログインしてください。");
                return;
            }

            const res = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    discordId,
                    userId: user?.id,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Checkout failed');
            }
            const { url } = data;
            if (url) window.location.href = url;
        } catch (error) {
            console.error('Checkout error:', error);
            alert("決済セッションの作成に失敗しました。");
        } finally {
            setCheckoutLoading(false);
        }
    };

    const isMember = userData?.subscriptionStatus === 'active';

    return (
        <div className="min-h-screen bg-cream text-black font-body selection:bg-pop-yellow selection:text-black overflow-x-hidden">
            <BrutalistHeader isSignedIn={isSignedIn ?? false} isMember={isMember ?? false} />

            <main>
                <BrutalistHero
                    isSignedIn={isSignedIn ?? false}
                    handleCheckout={handleCheckout}
                    checkoutLoading={checkoutLoading}
                />

                <BrutalistFeatures />

                {/* Removed LandingContent and LandingTeam for now as they are not brutalized yet. 
                    Can add them back if needed or create Brutalist versions. 
                    For now, focusing on the core flow. */}

                <BrutalistPricing
                    handleCheckout={handleCheckout}
                    checkoutLoading={checkoutLoading}
                />

                <div className="flex justify-center pb-10 relative z-10">
                    <StripeLinkModal />
                </div>
            </main>

            <BrutalistFooter />
            <BackToTop />
        </div>
    );
}

