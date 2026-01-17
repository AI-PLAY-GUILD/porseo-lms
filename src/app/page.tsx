"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";
import { StripeLinkModal } from "@/components/stripe-link-modal";
import { BrutalistHeader } from "@/components/landing/BrutalistHeader";
import { BrutalistHero } from "@/components/landing/BrutalistHero";
import { BrutalistAbout } from "@/components/landing/BrutalistAbout";
import { BrutalistShowcase } from "@/components/landing/BrutalistShowcase";
import { BrutalistTeam } from "@/components/landing/BrutalistTeam";
import { BrutalistPricing } from "@/components/landing/BrutalistPricing";
import { BrutalistFooter } from "@/components/landing/BrutalistFooter";
import { BackToTop } from "@/components/landing/back-to-top";
import { BrutalistLearning } from "@/components/landing/BrutalistLearning";
import { BrutalistCommunity } from "@/components/landing/BrutalistCommunity";
import { BrutalistFAQ } from "@/components/landing/BrutalistFAQ";
import { BrutalistHackathon } from "@/components/landing/BrutalistHackathon";

export default function Home() {
    const { isSignedIn, user, isLoaded } = useUser();
    const userData = useQuery(api.users.getUser);
    const syncCurrentUser = useMutation(api.users.syncCurrentUser);

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

                // Sync User with Discord ID
                await syncCurrentUser({
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
    }, [isLoaded, isSignedIn, user, isSynced, syncCurrentUser]);

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
            <BrutalistHeader isSignedIn={isSignedIn ?? false} isMember={isMember ?? false} isAdmin={userData?.isAdmin ?? false} />

            <main>
                <BrutalistHero
                    isSignedIn={isSignedIn ?? false}
                    handleCheckout={handleCheckout}
                    checkoutLoading={checkoutLoading}
                />

                <BrutalistAbout />

                <BrutalistShowcase />

                <BrutalistCommunity />

                <BrutalistLearning />

                <BrutalistHackathon />

                <BrutalistTeam />

                {/* Removed LandingContent and LandingTeam for now as they are not brutalized yet. 
                    Can add them back if needed or create Brutalist versions. 
                    For now, focusing on the core flow. */}

                <BrutalistPricing
                    handleCheckout={handleCheckout}
                    checkoutLoading={checkoutLoading}
                />

                <BrutalistFAQ />


            </main>

            <BrutalistFooter />
            <BackToTop />
        </div>
    );
}

