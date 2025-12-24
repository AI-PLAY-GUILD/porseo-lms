"use client";

import { SignInButton, SignOutButton, useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, LayoutDashboard, ShieldCheck, CreditCard, Sparkles, Check } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { StripeLinkModal } from "@/components/stripe-link-modal";

export default function JoinPage() {
    const { isSignedIn, user, isLoaded } = useUser();
    const userData = useQuery(api.users.getUser);
    const storeUser = useMutation(api.users.storeUser);

    const containerRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [isSynced, setIsSynced] = useState(false);

    // GSAP Animation
    useGSAP(() => {
        const tl = gsap.timeline({ defaults: { ease: "elastic.out(1, 0.5)" } });
        tl.fromTo(titleRef.current,
            { y: -50, opacity: 0 },
            { y: 0, opacity: 1, duration: 1, delay: 0.2 }
        )
            .fromTo(cardRef.current,
                { y: 50, opacity: 0, scale: 0.9 },
                { y: 0, opacity: 1, scale: 1, duration: 1 },
                "-=0.8"
            );
    }, { scope: containerRef });

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
        <div ref={containerRef} className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden font-body text-black bg-cream">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>

            {/* Floating Shapes */}
            <div className="absolute top-20 left-10 w-24 h-24 bg-pop-yellow rounded-full border-4 border-black brutal-shadow animate-blob animation-delay-2000 hidden md:block"></div>
            <div className="absolute bottom-40 right-10 w-32 h-32 bg-pop-purple rounded-none rotate-12 border-4 border-black brutal-shadow animate-blob hidden md:block"></div>
            <div className="absolute top-40 right-20 w-16 h-16 bg-pop-red rounded-full border-4 border-black brutal-shadow animate-blob animation-delay-4000 hidden md:block"></div>

            <main className="z-10 flex flex-col items-center gap-8 p-8 sm:p-20 w-full max-w-4xl">
                <div className="flex flex-col items-center gap-2 text-center">
                    <h1 ref={titleRef} className="flex flex-col items-center gap-2 opacity-0">
                        <span className="text-xl sm:text-2xl font-black text-black tracking-[0.2em] uppercase bg-pop-yellow px-4 border-2 border-black transform -rotate-2 brutal-shadow-sm">
                            AI Play Guild
                        </span>
                        <span className="text-3xl sm:text-5xl md:text-7xl font-black tracking-tighter text-black mt-4">
                            {isSignedIn ? "PLAYGROUND AREA" : "CHOOSE YOUR PLAN"}
                        </span>
                    </h1>
                </div>

                <div ref={cardRef} className="flex flex-col items-center gap-6 mt-10 w-full max-w-md opacity-0">
                    {isSignedIn ? (
                        <div className="flex flex-col items-center gap-6 w-full bg-white border-4 border-black p-8 rounded-3xl brutal-shadow-lg relative">
                            <div className="text-center space-y-2">
                                <p className="text-sm font-black text-pop-purple uppercase tracking-wider">WELCOME BACK</p>
                                <p className="text-2xl font-black text-black">{userData?.name} さん</p>
                            </div>

                            <div className="flex flex-col gap-4 w-full">
                                {isMember ? (
                                    <Button asChild size="lg" className="w-full h-16 text-lg font-black bg-pop-green text-black border-4 border-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-200 rounded-xl brutal-shadow">
                                        <Link href="/dashboard" className="flex items-center justify-center gap-2">
                                            <LayoutDashboard className="w-6 h-6" />
                                            学習を再開する
                                            <ArrowRight className="w-6 h-6 ml-1" />
                                        </Link>
                                    </Button>
                                ) : (
                                    <>
                                        <Button
                                            onClick={handleCheckout}
                                            disabled={checkoutLoading}
                                            size="lg"
                                            className="w-full h-16 text-lg font-black bg-pop-purple text-white border-4 border-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-200 rounded-xl brutal-shadow"
                                        >
                                            {checkoutLoading ? "Loading..." : (
                                                <span className="flex items-center justify-center gap-2">
                                                    <CreditCard className="w-6 h-6" />
                                                    JOIN NOW (¥980/mo)
                                                </span>
                                            )}
                                        </Button>
                                        <div className="flex justify-center">
                                            <StripeLinkModal />
                                        </div>
                                    </>
                                )}

                                {userData?.isAdmin && (
                                    <Button asChild variant="outline" size="lg" className="w-full h-14 text-base font-bold border-4 border-black bg-white text-black hover:bg-gray-100 transition-all duration-200 rounded-xl brutal-shadow-sm">
                                        <Link href="/admin" className="flex items-center justify-center gap-2">
                                            <ShieldCheck className="w-5 h-5" />
                                            管理者ダッシュボード
                                        </Link>
                                    </Button>
                                )}

                                <SignOutButton>
                                    <Button variant="ghost" className="w-full text-sm font-bold text-gray-500 hover:text-black hover:bg-black/5">
                                        別のアカウントでログイン
                                    </Button>
                                </SignOutButton>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col items-center gap-8 w-full bg-white border-4 border-black p-10 rounded-[40px] brutal-shadow-lg relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-pop-yellow rounded-full border-4 border-black -mr-16 -mt-16 z-0"></div>

                                <div className="space-y-6 text-center relative z-10 w-full">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pop-red border-2 border-black text-white text-xs font-black tracking-widest uppercase transform rotate-2 brutal-shadow-sm">
                                        <Sparkles className="w-3 h-3" />
                                        Premium Plan
                                    </div>

                                    <div>
                                        <div className="flex items-baseline justify-center gap-1 text-black">
                                            <span className="text-5xl sm:text-6xl font-black tracking-tighter">¥4,000</span>
                                            <span className="text-xl text-gray-500 font-bold">/ month</span>
                                        </div>
                                        <p className="text-black text-sm mt-2 font-bold bg-pop-green/20 inline-block px-2 py-1 rounded-md border-2 border-transparent">
                                            Unlock Full Access to AI Community
                                        </p>
                                    </div>

                                    <div className="w-full h-1 bg-black rounded-full" />

                                    <div className="space-y-4 text-left">
                                        {[
                                            "Unlimited Video Access",
                                            "Exclusive Discord Community",
                                            "Weekly Live Workshops",
                                            "Source Code Downloads"
                                        ].map((feature, i) => (
                                            <div key={i} className="flex items-center gap-3 text-base font-bold text-black">
                                                <div className="w-6 h-6 rounded-full bg-pop-green border-2 border-black flex items-center justify-center flex-shrink-0">
                                                    <Check className="w-4 h-4 text-black" />
                                                </div>
                                                {feature}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <SignInButton mode="modal">
                                    <Button size="lg" className="w-full h-20 text-xl font-black bg-pop-purple text-white border-4 border-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-200 rounded-2xl relative z-10 brutal-shadow mt-4 animate-brutal-pulse hover:animate-none">
                                        <span className="flex items-center gap-2">
                                            SUBSCRIBE NOW
                                            <ArrowRight className="w-6 h-6" />
                                        </span>
                                    </Button>
                                </SignInButton>

                                <p className="text-[10px] font-bold text-gray-400 text-center relative z-10 uppercase tracking-wide">
                                    Secure payment via Stripe. Cancel anytime.
                                </p>
                            </div>

                            <Button asChild variant="link" className="text-black font-bold hover:text-pop-red transition-colors">
                                <Link href="/">
                                    <ArrowRight className="w-5 h-5 mr-2 rotate-180" />
                                    BACK TO HOME
                                </Link>
                            </Button>
                        </>
                    )}
                </div>
            </main >

            <footer className="absolute bottom-6 text-[10px] font-black text-black z-10 uppercase tracking-widest">
                © 2025 PORSEO AI Community Platform
            </footer>
        </div >
    );
}
