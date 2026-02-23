"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BrutalistCommunity } from "@/components/landing/BrutalistCommunity";
import { BrutalistFAQ } from "@/components/landing/BrutalistFAQ";
import { BrutalistFooter } from "@/components/landing/BrutalistFooter";
import { BrutalistHackathon } from "@/components/landing/BrutalistHackathon";
import { BrutalistHeader } from "@/components/landing/BrutalistHeader";
import { BrutalistHero } from "@/components/landing/BrutalistHero";
import { BrutalistLearning } from "@/components/landing/BrutalistLearning";
import { BrutalistPricing } from "@/components/landing/BrutalistPricing";
import { BrutalistShowcase } from "@/components/landing/BrutalistShowcase";
import { BrutalistTeam } from "@/components/landing/BrutalistTeam";
import { BrutalistWhat } from "@/components/landing/BrutalistWhat";
import { BrutalistWhy } from "@/components/landing/BrutalistWhy";
import { BackToTop } from "@/components/landing/back-to-top";
import { CommunityIntro } from "@/components/landing/community-intro";
import { api } from "../../convex/_generated/api";

export default function Home() {
    const router = useRouter();
    const { isSignedIn, user, isLoaded } = useUser();
    const userData = useQuery(api.users.getUser);
    const storeUser = useMutation(api.users.storeUser);

    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [isSynced, setIsSynced] = useState(false);

    // Redirect logged-in users to dashboard
    useEffect(() => {
        if (isLoaded && isSignedIn) {
            router.push("/dashboard");
        }
    }, [isLoaded, isSignedIn, router]);

    // Sync User & Auto-Join
    useEffect(() => {
        const sync = async () => {
            if (!isLoaded || !isSignedIn || !user || isSynced) return;

            try {
                const discordAccount = user.externalAccounts.find(
                    (acc) => (acc.provider as string) === "oauth_discord" || (acc.provider as string) === "discord",
                );
                const _discordId = discordAccount?.providerUserId;

                // Store User (discordId removed for security - Issue #16)
                await storeUser({
                    clerkId: user.id,
                    email: user.primaryEmailAddress?.emailAddress || "",
                    name: user.fullName || user.username || "Unknown",
                    imageUrl: user.imageUrl,
                });

                // Auto-join Discord Server
                try {
                    await fetch("/api/join-server", { method: "POST" });
                } catch (e) {
                    console.error("Failed to auto-join server:", e);
                }

                // Check Subscription (Role Sync)
                try {
                    await fetch("/api/check-subscription", { method: "POST" });
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
                (acc) => (acc.provider as string) === "oauth_discord" || (acc.provider as string) === "discord",
            );
            const discordId = discordAccount?.providerUserId;

            if (!discordId) {
                console.error("Discord ID not found");
                alert("Discord IDが見つかりません。もう一度ログインしてください。");
                return;
            }

            const res = await fetch("/api/create-checkout-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    discordId,
                    userId: user?.id,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Checkout failed");
            }
            const { url } = data;
            if (url) window.location.href = url;
        } catch (error) {
            console.error("Checkout error:", error);
            alert("決済セッションの作成に失敗しました。");
        } finally {
            setCheckoutLoading(false);
        }
    };

    const isMember = userData?.subscriptionStatus === "active";

    return (
        <div className="min-h-screen bg-white text-black font-body selection:bg-pop-yellow selection:text-black overflow-x-hidden">
            <BrutalistHeader
                isSignedIn={isSignedIn ?? false}
                isMember={isMember ?? false}
                isAdmin={userData?.isAdmin ?? false}
            />

            <main>
                <BrutalistHero
                    isSignedIn={isSignedIn ?? false}
                    handleCheckout={handleCheckout}
                    checkoutLoading={checkoutLoading}
                />

                <CommunityIntro />

                <BrutalistWhy />

                <BrutalistWhat />

                <BrutalistShowcase />

                <BrutalistCommunity />

                <BrutalistLearning />

                <BrutalistHackathon />

                <BrutalistTeam />

                {/* Removed LandingContent and LandingTeam for now as they are not brutalized yet. 
                    Can add them back if needed or create Brutalist versions. 
                    For now, focusing on the core flow. */}

                <BrutalistPricing handleCheckout={handleCheckout} checkoutLoading={checkoutLoading} />

                <BrutalistFAQ />
            </main>

            <BrutalistFooter />
            <BackToTop />
        </div>
    );
}
