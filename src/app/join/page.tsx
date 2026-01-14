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
        <div ref={containerRef} className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden font-body text-foreground bg-background">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0, 85, 255, 0.05) 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 -z-10"></div>
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2 -z-10"></div>

            <main className="z-10 flex flex-col items-center gap-8 p-8 sm:p-20 w-full max-w-4xl">
                <div className="flex flex-col items-center gap-4 text-center">
                    <h1 ref={titleRef} className="flex flex-col items-center gap-2 opacity-0">
                        <span className="text-sm font-bold text-primary tracking-widest uppercase bg-primary/10 px-4 py-1 rounded-full border border-primary/20">
                            AI Play Guild
                        </span>
                        <span className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground mt-4">
                            {isSignedIn ? "PLAYGROUND AREA" : "CHOOSE YOUR PLAN"}
                        </span>
                    </h1>
                </div>

                <div ref={cardRef} className="flex flex-col items-center gap-6 mt-10 w-full max-w-md opacity-0">
                    {isSignedIn ? (
                        <div className="flex flex-col items-center gap-6 w-full bg-white/80 backdrop-blur-md border border-border/50 p-8 rounded-3xl shadow-soft relative">
                            <div className="text-center space-y-2">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">WELCOME BACK</p>
                                <p className="text-2xl font-extrabold text-foreground">{userData?.name} さん</p>
                            </div>

                            <div className="flex flex-col gap-4 w-full">
                                {isMember ? (
                                    <Button asChild size="lg" variant="gradient" className="w-full h-14 text-lg font-bold rounded-full shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-105 transition-all duration-300">
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
                                            variant="gradient"
                                            className="w-full h-14 text-lg font-bold rounded-full shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-105 transition-all duration-300"
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
                                    <Button asChild variant="outline" size="lg" className="w-full h-12 text-base font-bold border border-border/50 bg-background text-foreground hover:bg-secondary/50 transition-all duration-200 rounded-full shadow-sm">
                                        <Link href="/admin" className="flex items-center justify-center gap-2">
                                            <ShieldCheck className="w-4 h-4" />
                                            管理者ダッシュボード
                                        </Link>
                                    </Button>
                                )}

                                <SignOutButton>
                                    <Button variant="ghost" className="w-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-full">
                                        別のアカウントでログイン
                                    </Button>
                                </SignOutButton>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col items-center gap-8 w-full bg-white/80 backdrop-blur-md border border-border/50 p-10 rounded-[32px] shadow-soft relative overflow-hidden group hover:shadow-lg transition-all duration-500">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-3xl -mr-16 -mt-16 z-0 pointer-events-none"></div>

                                <div className="space-y-6 text-center relative z-10 w-full">
                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary to-accent text-white text-xs font-bold tracking-widest uppercase shadow-md shadow-primary/20">
                                        <Sparkles className="w-3 h-3" />
                                        Premium Plan
                                    </div>

                                    <div>
                                        <div className="flex items-baseline justify-center gap-1 text-foreground">
                                            <span className="text-5xl sm:text-6xl font-extrabold tracking-tight">¥4,000</span>
                                            <span className="text-xl text-muted-foreground font-medium">/ month</span>
                                        </div>
                                        <p className="text-primary text-sm mt-3 font-bold bg-primary/5 inline-block px-3 py-1 rounded-full border border-primary/10">
                                            Unlock Full Access to AI Community
                                        </p>
                                    </div>

                                    <div className="w-full h-px bg-border/50" />

                                    <div className="space-y-4 text-left">
                                        {[
                                            "超実践型ハンズオン（ライブ＆アーカイブ）",
                                            "独自学習管理システム利用権",
                                            "Discordコミュニティ参加権",
                                            "ハッカソンへの参加・フィードバック",
                                            "メンバー限定のソースコード共有"
                                        ].map((feature, i) => (
                                            <div key={i} className="flex items-center gap-3 text-base font-medium text-foreground/80">
                                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                                                    <Check className="w-4 h-4" />
                                                </div>
                                                {feature}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <SignInButton mode="modal">
                                    <Button size="lg" variant="gradient" className="w-full h-16 text-xl font-bold rounded-full shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-105 transition-all duration-300 relative z-10 mt-4">
                                        <span className="flex items-center gap-2">
                                            今すぐ参加する
                                            <ArrowRight className="w-6 h-6" />
                                        </span>
                                    </Button>
                                </SignInButton>

                                <p className="text-[10px] font-medium text-muted-foreground text-center relative z-10 uppercase tracking-wide">
                                    Secure payment via Stripe. Cancel anytime.
                                </p>
                            </div>

                            <Button asChild variant="link" className="text-muted-foreground font-bold hover:text-primary transition-colors">
                                <Link href="/">
                                    <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                                    BACK TO HOME
                                </Link>
                            </Button>
                        </>
                    )}
                </div>
            </main >

            <footer className="absolute bottom-6 text-[10px] font-bold text-muted-foreground z-10 uppercase tracking-widest">
                © 2025 PORSEO AI Community Platform
            </footer>
        </div >
    );
}
