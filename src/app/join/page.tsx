"use client";

import { SignInButton, SignOutButton, SignUpButton, useUser } from "@clerk/nextjs";
import { useGSAP } from "@gsap/react";
import { useMutation, useQuery } from "convex/react";
import gsap from "gsap";
import { AlertTriangle, ArrowRight, Check, CreditCard, LayoutDashboard, ShieldCheck, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { StripeLinkModal } from "@/components/stripe-link-modal";
import { Button } from "@/components/ui/button";
import { api } from "../../../convex/_generated/api";

export default function JoinPage() {
    const { isSignedIn, user, isLoaded } = useUser();
    const userData = useQuery(api.users.getUser);
    const storeUser = useMutation(api.users.storeUser);
    const recordConsent = useMutation(api.users.recordConsent);

    const containerRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [isSynced, setIsSynced] = useState(false);
    const [termsChecked, setTermsChecked] = useState(false);
    const [privacyChecked, setPrivacyChecked] = useState(false);
    const [guidelinesChecked, setGuidelinesChecked] = useState(false);

    const canProceed = termsChecked && privacyChecked && guidelinesChecked;

    // GSAP Animation
    useGSAP(
        () => {
            const tl = gsap.timeline({ defaults: { ease: "elastic.out(1, 0.5)" } });
            tl.fromTo(titleRef.current, { y: -50, opacity: 0 }, { y: 0, opacity: 1, duration: 1, delay: 0.2 }).fromTo(
                cardRef.current,
                { y: 50, opacity: 0, scale: 0.9 },
                { y: 0, opacity: 1, scale: 1, duration: 1 },
                "-=0.8",
            );
        },
        { scope: containerRef },
    );

    // Sync User & Auto-Join
    useEffect(() => {
        const sync = async () => {
            if (!isLoaded || !isSignedIn || !user || isSynced) return;
            try {
                const discordAccount = user.externalAccounts.find(
                    (acc) => (acc.provider as string) === "oauth_discord" || (acc.provider as string) === "discord",
                );
                const _discordId = discordAccount?.providerUserId;
                await storeUser({
                    clerkId: user.id,
                    email: user.primaryEmailAddress?.emailAddress || "",
                    name: user.fullName || user.username || "Unknown",
                    imageUrl: user.imageUrl,
                });
                try { await fetch("/api/join-server", { method: "POST" }); } catch (e) { console.error("Failed to auto-join server:", e); }
                try { await fetch("/api/check-subscription", { method: "POST" }); } catch (e) { console.error("Failed to check subscription:", e); }
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
                alert("Discord IDが見つかりません。もう一度ログインしてください。");
                return;
            }
            // 同意情報をConvexのユーザーレコードへ記録する
            try {
                if (user?.id) {
                    await recordConsent({
                        clerkId: user.id,
                        terms: termsChecked,
                        privacy: privacyChecked,
                        guidelines: guidelinesChecked,
                    });
                }
            } catch (consentError) {
                console.error("Failed to record consent:", consentError);
                // 記録に失敗しても決済プロセス自体は止めない仕様とするか、止めるか。今回は止めずにエラーログのみ。
            }

            const res = await fetch("/api/create-checkout-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ discordId, userId: user?.id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Checkout failed");
            if (data.url) window.location.href = data.url;
        } catch (error) {
            console.error("Checkout error:", error);
            alert("決済セッションの作成に失敗しました。");
        } finally {
            setCheckoutLoading(false);
        }
    };

    const isMember = userData?.subscriptionStatus === "active";

    return (
        <div ref={containerRef} className="join-root">
            <div className="join-bg" />
            <div className="join-grid" />
            <div className="join-orb join-orb-1" />
            <div className="join-orb join-orb-2" />
            <div className="join-orb join-orb-3" />

            <main className="z-10 flex flex-col items-center gap-8 p-6 sm:p-16 w-full max-w-4xl">
                <div className="flex flex-col items-center gap-2 text-center">
                    <h1 ref={titleRef} className="flex flex-col items-center gap-0 opacity-0">
                        <span className="join-main-title-top">
                            {isSignedIn ? "メンバーエリア" : "AI PLAY GUILD"}
                        </span>
                        {!isSignedIn && (
                            <span className="join-main-title-bottom">メンバーシップ</span>
                        )}
                    </h1>
                </div>

                <div ref={cardRef} className="flex flex-col items-center gap-5 mt-4 w-full max-w-md opacity-0">
                    {isSignedIn ? (
                        <div className="join-card">
                            <div className="text-center space-y-1">
                                <p className="text-xs font-bold uppercase tracking-widest text-sky-500">WELCOME BACK</p>
                                <p className="text-2xl font-black text-gray-900">{userData?.name} さん</p>
                            </div>
                            <div className="flex flex-col gap-3 w-full mt-2">
                                {isMember ? (
                                    <Button asChild size="lg" className="join-btn join-btn-primary">
                                        <Link href="/dashboard" className="flex items-center justify-center gap-2">
                                            <LayoutDashboard className="w-5 h-5" />
                                            学習を再開する
                                            <ArrowRight className="w-5 h-5 ml-1" />
                                        </Link>
                                    </Button>
                                ) : (
                                    <>
                                        <Button onClick={handleCheckout} disabled={checkoutLoading} size="lg" className="join-btn join-btn-checkout">
                                            {checkoutLoading ? "Loading..." : (
                                                <span className="flex items-center justify-center gap-2">
                                                    <CreditCard className="w-5 h-5" />
                                                    今すぐ参加する
                                                </span>
                                            )}
                                        </Button>
                                        <div className="flex justify-center"><StripeLinkModal /></div>
                                    </>
                                )}
                                {userData?.isAdmin && (
                                    <Button asChild variant="outline" size="lg" className="join-btn join-btn-admin">
                                        <Link href="/admin" className="flex items-center justify-center gap-2">
                                            <ShieldCheck className="w-5 h-5" />
                                            管理者ダッシュボード
                                        </Link>
                                    </Button>
                                )}
                                <SignOutButton>
                                    <Button variant="ghost" className="w-full text-sm font-medium text-gray-400 hover:text-gray-700 hover:bg-gray-50">
                                        別のアカウントでログイン
                                    </Button>
                                </SignOutButton>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="join-card">

                                <div className="text-center space-y-2">
                                    <div className="flex items-baseline justify-center gap-1">
                                        <span className="join-price">¥4,000</span>
                                        <span className="join-price-unit">/ 月</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-2 flex-wrap">
                                        <span className="join-info-badge">入会金/解約金0円</span>
                                        <span className="join-info-badge">入退会自由</span>
                                    </div>
                                </div>

                                <div className="w-full h-px bg-sky-100" />

                                <div className="space-y-3 w-full text-left">
                                    {[
                                        "超実践型ハンズオン（ライブ＆アーカイブ）",
                                        "独自学習管理システム利用権",
                                        "Discordコミュニティ参加権",
                                        "ハッカソンへの参加・フィードバック",
                                        "メンバー限定のソースコード共有",
                                    ].map((feature, i) => (
                                        <div key={i} className="flex items-center gap-3 text-sm font-medium text-gray-700">
                                            <div className="join-check-icon">
                                                <Check className="w-3.5 h-3.5 text-white" />
                                            </div>
                                            {feature}
                                        </div>
                                    ))}
                                </div>

                                <div className="w-full h-px bg-sky-100" />

                                {/* ⚠️ Discord-ONLY emphatic warning */}
                                <div className="join-discord-alert">
                                    <div className="join-discord-alert-header">
                                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                        <span className="font-bold">重要なお知らせ</span>
                                    </div>
                                    <p className="join-discord-alert-body">
                                        このコミュニティは<strong>Discordアカウントのみ</strong>利用可能です。メール・Google等のアカウントではサービスをご利用いただけません。
                                    </p>
                                </div>

                                {/* ── Checkboxes (fixed: no label/input conflict) ── */}
                                <div className="join-consent-wrap">
                                    <div
                                        className="join-consent-row"
                                        onClick={() => setTermsChecked(v => !v)}
                                        role="checkbox"
                                        aria-checked={termsChecked}
                                        tabIndex={0}
                                        onKeyDown={e => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); setTermsChecked(v => !v); } }}
                                    >
                                        <div className={`join-checkbox ${termsChecked ? "join-checkbox-checked" : ""}`}>
                                            {termsChecked && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <span className="join-consent-text">
                                            <a
                                                href="/terms"
                                                target="_blank"
                                                rel="noreferrer"
                                                className="join-consent-link"
                                                onClick={e => e.stopPropagation()}
                                            >
                                                利用規約
                                            </a>
                                            に同意します
                                        </span>
                                    </div>

                                    <div
                                        className="join-consent-row"
                                        onClick={() => setPrivacyChecked(v => !v)}
                                        role="checkbox"
                                        aria-checked={privacyChecked}
                                        tabIndex={0}
                                        onKeyDown={e => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); setPrivacyChecked(v => !v); } }}
                                    >
                                        <div className={`join-checkbox ${privacyChecked ? "join-checkbox-checked" : ""}`}>
                                            {privacyChecked && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <span className="join-consent-text">
                                            <a
                                                href="/privacy"
                                                target="_blank"
                                                rel="noreferrer"
                                                className="join-consent-link"
                                                onClick={e => e.stopPropagation()}
                                            >
                                                プライバシーポリシー
                                            </a>
                                            に同意します
                                        </span>
                                    </div>

                                    <div
                                        className="join-consent-row"
                                        onClick={() => setGuidelinesChecked(v => !v)}
                                        role="checkbox"
                                        aria-checked={guidelinesChecked}
                                        tabIndex={0}
                                        onKeyDown={e => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); setGuidelinesChecked(v => !v); } }}
                                    >
                                        <div className={`join-checkbox ${guidelinesChecked ? "join-checkbox-checked" : ""}`}>
                                            {guidelinesChecked && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <span className="join-consent-text">
                                            <a
                                                href="/guidelines"
                                                target="_blank"
                                                rel="noreferrer"
                                                className="join-consent-link"
                                                onClick={e => e.stopPropagation()}
                                            >
                                                コミュニティガイドライン
                                            </a>
                                            に同意します
                                        </span>
                                    </div>
                                </div>

                                <SignUpButton mode="modal">
                                    <Button
                                        size="lg"
                                        disabled={!canProceed}
                                        className="join-btn join-btn-cta"
                                        style={{ width: "100%" }}
                                    >
                                        <span className="flex items-center gap-2">
                                            今すぐ参加する
                                            <ArrowRight className="w-5 h-5" />
                                        </span>
                                    </Button>
                                </SignUpButton>

                                <p className="text-[10px] font-medium text-gray-400 text-center uppercase tracking-wide">
                                    Secure payment via Stripe · Cancel anytime
                                </p>
                            </div>

                            <Button asChild variant="link" className="text-gray-400 font-medium hover:text-gray-700 transition-colors">
                                <Link href="/">
                                    <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                                    ホームへ戻る
                                </Link>
                            </Button>
                        </>
                    )}
                </div>
            </main>

            <footer className="absolute bottom-6 text-[10px] font-medium text-gray-400 z-10 uppercase tracking-widest">
                © 2025 AI PLAY GUILD
            </footer>

            <style>{`
                .join-root {
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    overflow: hidden;
                    background: #f0f9ff;
                    font-family: 'Noto Sans JP', sans-serif;
                }
                .join-bg {
                    position: absolute; inset: 0;
                    background:
                        radial-gradient(ellipse 70% 50% at 10% 5%, rgba(56,189,248,0.18) 0%, transparent 60%),
                        radial-gradient(ellipse 55% 45% at 90% 95%, rgba(6,182,212,0.12) 0%, transparent 60%),
                        radial-gradient(ellipse 80% 70% at 50% 50%, #f0f9ff 0%, #e0f2fe 100%);
                    z-index: 0;
                }
                .join-grid {
                    position: absolute; inset: 0;
                    background-image:
                        linear-gradient(rgba(14,165,233,0.065) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(14,165,233,0.065) 1px, transparent 1px);
                    background-size: 56px 56px;
                    z-index: 1;
                    mask-image: radial-gradient(ellipse 70% 70% at 50% 40%, black, transparent);
                }
                .join-orb { position: absolute; border-radius: 50%; filter: blur(90px); z-index: 0; }
                .join-orb-1 {
                    width: 420px; height: 420px;
                    background: radial-gradient(circle, rgba(56,189,248,0.20) 0%, transparent 70%);
                    top: -120px; left: -130px;
                    animation: join-orb-a 14s ease-in-out infinite;
                }
                .join-orb-2 {
                    width: 320px; height: 320px;
                    background: radial-gradient(circle, rgba(6,182,212,0.14) 0%, transparent 70%);
                    bottom: -60px; right: -80px;
                    animation: join-orb-a 16s ease-in-out infinite reverse;
                }
                .join-orb-3 {
                    width: 240px; height: 240px;
                    background: radial-gradient(circle, rgba(96,165,250,0.09) 0%, transparent 70%);
                    top: 52%; left: 8%;
                    animation: join-orb-a 11s ease-in-out infinite; animation-delay: -6s;
                }
                @keyframes join-orb-a {
                    0%, 100% { transform: translateY(0) scale(1); }
                    50% { transform: translateY(-22px) scale(1.05); }
                }

                .join-badge {
                    font-size: 0.68rem; font-weight: 800; letter-spacing: 0.22em; text-transform: uppercase;
                    color: #7ecaea; border: 1px solid rgba(14,165,233,0.22);
                    padding: 0.32rem 1rem; border-radius: 999px; background: rgba(14,165,233,0.07);
                }
                .join-main-title-top {
                    font-family: 'Noto Sans JP', sans-serif;
                    font-size: clamp(2rem, 8vw, 3.4rem);
                    font-weight: 200;
                    color: #0c1a2e;
                    letter-spacing: 0.12em;
                    line-height: 1.15;
                    text-transform: uppercase;
                }
                .join-main-title-bottom {
                    font-family: 'Noto Sans JP', sans-serif;
                    font-size: clamp(1.1rem, 4vw, 1.7rem);
                    font-weight: 200;
                    color: #5ba8c8;
                    letter-spacing: 0.22em;
                    line-height: 1.3;
                    text-transform: uppercase;
                }

                .join-card {
                    width: 100%;
                    display: flex; flex-direction: column; align-items: center; gap: 1.2rem;
                    padding: 2.25rem 2rem;
                    background: rgba(255,255,255,0.88);
                    border: 1px solid rgba(14,165,233,0.16);
                    border-radius: 28px;
                    backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
                    box-shadow:
                        0 0 0 1px rgba(14,165,233,0.07),
                        0 24px 60px rgba(14,165,233,0.10),
                        0 4px 16px rgba(0,0,0,0.04);
                }

                .join-premium-badge {
                    display: inline-flex; align-items: center; gap: 0.4rem;
                    padding: 0.32rem 0.9rem; border-radius: 999px;
                    background: linear-gradient(135deg, rgba(56,189,248,0.15), rgba(6,182,212,0.10));
                    border: 1px solid rgba(14,165,233,0.28);
                    color: #0ea5e9; font-size: 0.68rem; font-weight: 800;
                    letter-spacing: 0.12em; text-transform: uppercase;
                }

                .join-price { font-size: 3.2rem; font-weight: 200; color: #0c1a2e; letter-spacing: -0.01em; }
                .join-price-unit { font-size: 1rem; color: #9ca3af; font-weight: 500; }
                .join-price-desc { font-size: 0.8rem; color: #9ca3af; }
                .join-info-badge {
                    display: inline-block;
                    font-size: 0.72rem;
                    font-weight: 600;
                    color: #0ea5e9;
                    border: 1.5px solid rgba(14,165,233,0.35);
                    border-radius: 6px;
                    padding: 0.22rem 0.7rem;
                    letter-spacing: 0.04em;
                    background: rgba(14,165,233,0.06);
                }

                .join-check-icon {
                    width: 22px; height: 22px; border-radius: 50%;
                    background: linear-gradient(135deg, #38bdf8, #06b6d4);
                    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
                }

                /* Discord-ONLY warning */
                .join-discord-alert {
                    width: 100%; border-radius: 14px;
                    background: #fff8e1; border: 1.5px solid #f59e0b;
                    padding: 0.85rem 1rem;
                    display: flex; flex-direction: column; gap: 0.5rem;
                }
                .join-discord-alert-header {
                    display: flex; align-items: center; gap: 0.5rem;
                    color: #b45309; font-size: 0.82rem;
                }
                .join-discord-alert-body {
                    font-size: 0.78rem; color: #78350f; line-height: 1.65; padding-left: 1.5rem;
                }
                .join-discord-alert-body strong { color: #92400e; }

                /* Checkboxes */
                .join-consent-wrap { width: 100%; display: flex; flex-direction: column; gap: 0.7rem; }

                .join-consent-row {
                    display: flex; align-items: center; gap: 0.65rem;
                    cursor: pointer; user-select: none;
                    padding: 0.2rem 0;
                    outline: none;
                }
                .join-consent-row:focus-visible .join-checkbox {
                    outline: 2px solid rgba(14,165,233,0.5);
                    outline-offset: 2px;
                }

                .join-checkbox {
                    width: 20px; height: 20px; flex-shrink: 0;
                    border: 1.5px solid #bae6fd; border-radius: 5px;
                    background: #f0f9ff;
                    display: flex; align-items: center; justify-content: center;
                    transition: background 0.18s, border-color 0.18s;
                    pointer-events: none; /* let parent div handle clicks */
                }
                .join-checkbox-checked {
                    background: linear-gradient(135deg, #38bdf8, #06b6d4);
                    border-color: transparent;
                }

                .join-consent-text { font-size: 0.8rem; color: #6b7280; }
                .join-consent-link {
                    color: #0ea5e9; text-decoration: underline;
                    text-underline-offset: 2px; transition: color 0.2s;
                }
                .join-consent-link:hover { color: #0284c7; }

                /* Buttons */
                .join-btn {
                    height: 54px !important; font-size: 1rem !important;
                    font-weight: 700 !important; border-radius: 14px !important;
                    transition: all 0.2s !important; width: 100%; border: none !important;
                }
                .join-btn-primary {
                    background: linear-gradient(135deg, #4ade80, #22c55e) !important; color: #fff !important;
                }
                .join-btn-primary:hover { opacity: 0.88 !important; transform: translateY(-1px) !important; }

                .join-btn-checkout {
                    background: linear-gradient(135deg, #38bdf8, #06b6d4) !important; color: #fff !important;
                }
                .join-btn-checkout:hover { opacity: 0.88 !important; transform: translateY(-1px) !important; }

                .join-btn-admin {
                    background: #f0f9ff !important; border: 1px solid #bae6fd !important; color: #0ea5e9 !important;
                }
                .join-btn-admin:hover { background: #e0f2fe !important; }

                .join-btn-cta {
                    background: linear-gradient(135deg, #38bdf8, #06b6d4) !important;
                    color: #fff !important; height: 58px !important; font-size: 1.05rem !important;
                    box-shadow: 0 4px 20px rgba(14,165,233,0.28) !important;
                }
                .join-btn-cta:disabled {
                    opacity: 0.38 !important; cursor: not-allowed !important;
                    transform: none !important; box-shadow: none !important;
                }
                .join-btn-cta:not(:disabled):hover {
                    opacity: 0.88 !important; transform: translateY(-1px) !important;
                }

                @media (max-width: 480px) {
                    .join-card { padding: 1.75rem 1.25rem; border-radius: 20px; }
                    .join-main-title-top { font-size: 2rem; }
                    .join-main-title-bottom { font-size: 1rem; }
                }
            `}</style>
        </div>
    );
}
