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
    const syncCurrentUser = useMutation(api.users.syncCurrentUser);

    const containerRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [isSynced, setIsSynced] = useState(false);

    // GSAP Animation
    useGSAP(() => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl.fromTo(titleRef.current,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 1, delay: 0.2 }
        )
            .fromTo(cardRef.current,
                { y: 30, opacity: 0, scale: 0.95 },
                { y: 0, opacity: 1, scale: 1, duration: 1 },
                "-=0.6"
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
        <div ref={containerRef} className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden font-body text-foreground bg-[#f6f6f8] dark:bg-[#101622]">
            {/* Background Pattern */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
            </div>

            <main className="z-10 flex flex-col items-center gap-8 p-8 sm:p-20 w-full max-w-4xl">
                <div className="flex flex-col items-center gap-4 text-center">
                    <h1 ref={titleRef} className="flex flex-col items-center gap-2 opacity-0">
                        <span className="text-sm font-light text-primary tracking-widest uppercase bg-primary/5 px-4 py-1 rounded-full border border-primary/10 backdrop-blur-sm">
                            AI Play Guild
                        </span>
                        <span className="text-4xl sm:text-6xl md:text-7xl font-thin tracking-tighter text-foreground mt-4">
                            {isSignedIn ? "PLAYGROUND AREA" : "CHOOSE YOUR PLAN"}
                        </span>
                    </h1>
                </div>

                <div ref={cardRef} className="flex flex-col items-center gap-6 mt-10 w-full max-w-md opacity-0">
                    {isSignedIn ? (
                        <div className="flex flex-col items-center gap-6 w-full glass-panel p-8 rounded-3xl relative">
                            <div className="text-center space-y-2">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">WELCOME BACK</p>
                                <p className="text-2xl font-thin text-foreground">{userData?.name} さん</p>
                            </div>

                            <div className="flex flex-col gap-4 w-full">
                                {isMember ? (
                                    <Button asChild size="lg" className="w-full h-14 text-lg font-light rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 hover:border-white/30 hover:shadow-[0_0_30px_rgba(19,91,236,0.3)] transition-all duration-300 text-foreground">
                                        <Link href="/dashboard" className="flex items-center justify-center gap-2">
                                            <LayoutDashboard className="w-5 h-5" />
                                            学習を再開する
                                            <ArrowRight className="w-5 h-5 ml-1" />
                                        </Link>
                                    </Button>
                                ) : (
                                    <>
                                        <Button
                                            onClick={handleCheckout}
                                            disabled={checkoutLoading}
                                            size="lg"
                                            className="w-full h-14 text-lg font-light rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 hover:border-white/30 hover:shadow-[0_0_30px_rgba(19,91,236,0.3)] transition-all duration-300 text-foreground"
                                        >
                                            {checkoutLoading ? "Loading..." : (
                                                <span className="flex items-center justify-center gap-2">
                                                    <CreditCard className="w-5 h-5" />
                                                    今すぐ参加する
                                                </span>
                                            )}
                                        </Button>
                                        <div className="flex justify-center">
                                            <StripeLinkModal />
                                        </div>
                                    </>
                                )}

                                {userData?.isAdmin && (
                                    <Button asChild variant="outline" size="lg" className="w-full h-12 text-base font-light border border-white/10 bg-white/5 text-foreground hover:bg-white/10 transition-all duration-200 rounded-full shadow-sm backdrop-blur-sm">
                                        <Link href="/admin" className="flex items-center justify-center gap-2">
                                            <ShieldCheck className="w-4 h-4" />
                                            管理者ダッシュボード
                                        </Link>
                                    </Button>
                                )}

                                <SignOutButton>
                                    <Button variant="ghost" className="w-full text-sm font-light text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-full">
                                        別のアカウントでログイン
                                    </Button>
                                </SignOutButton>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col items-center gap-8 w-full glass-panel p-10 rounded-[32px] relative overflow-hidden group hover:bg-white/20 transition-all duration-500">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-3xl -mr-16 -mt-16 z-0 pointer-events-none"></div>

                                <div className="space-y-6 text-center relative z-10 w-full">
                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-foreground text-xs font-light tracking-widest uppercase shadow-sm">
                                        <Sparkles className="w-3 h-3 text-primary" />
                                        Premium Plan
                                    </div>

                                    <div>
                                        <div className="flex items-baseline justify-center gap-1 text-foreground">
                                            <span className="text-5xl sm:text-6xl font-thin tracking-tighter">¥4,000</span>
                                            <span className="text-xl text-muted-foreground font-light">/ month</span>
                                        </div>
                                        <p className="text-primary text-sm mt-3 font-light bg-primary/5 inline-block px-3 py-1 rounded-full border border-primary/10">
                                            Unlock Full Access to AI Community
                                        </p>
                                    </div>

                                    <div className="w-full h-px bg-white/10" />

                                    <div className="space-y-4 text-left">
                                        {[
                                            "超実践型ハンズオン（ライブ＆アーカイブ）",
                                            "独自学習管理システム利用権",
                                            "Discordコミュニティ参加権",
                                            "ハッカソンへの参加・フィードバック",
                                            "メンバー限定のソースコード共有"
                                        ].map((feature, i) => (
                                            <div key={i} className="flex items-center gap-3 text-base font-light text-foreground/80">
                                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary border border-primary/20">
                                                    <Check className="w-3 h-3" />
                                                </div>
                                                {feature}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <SignInButton mode="modal">
                                    <Button size="lg" className="w-full h-16 text-xl font-light rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 hover:border-white/30 hover:shadow-[0_0_30px_rgba(19,91,236,0.3)] transition-all duration-300 relative z-10 mt-4 text-foreground">
                                        <span className="flex items-center gap-2">
                                            今すぐ参加する
                                            <ArrowRight className="w-6 h-6" />
                                        </span>
                                    </Button>
                                </SignInButton>

                                <p className="text-[10px] font-light text-muted-foreground text-center relative z-10 uppercase tracking-wide">
                                    Secure payment via Stripe. Cancel anytime.
                                </p>
                            </div>

                            <Button asChild variant="link" className="text-muted-foreground font-light hover:text-primary transition-colors">
                                <Link href="/">
                                    <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                                    BACK TO HOME
                                </Link>
                            </Button>
                        </>
                    )}
                </div>
            </main >

            <footer className="absolute bottom-6 text-[10px] font-light text-muted-foreground z-10 uppercase tracking-widest">
                © 2025 PORSEO AI Community Platform
            </footer>
        </div >
    );
}
