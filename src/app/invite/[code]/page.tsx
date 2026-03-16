"use client";

import { useAuth, useSignIn } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { Check, Gift } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import { api } from "../../../../convex/_generated/api";

function InviteContent() {
    const { code } = useParams<{ code: string }>();
    const { signIn, isLoaded } = useSignIn();
    const { isSignedIn, isLoaded: isAuthLoaded } = useAuth();
    const router = useRouter();
    // biome-ignore lint/suspicious/noExplicitAny: notePromo module not yet in generated API types
    const validation = useQuery((api as any).notePromo.validatePromoCode, { code: code ?? "" });

    // Already signed in → go to activate page
    useEffect(() => {
        if (isAuthLoaded && isSignedIn) {
            router.replace(`/invite/${code}/activate`);
        }
    }, [isAuthLoaded, isSignedIn, code, router]);

    const handleDiscordLogin = async () => {
        if (!isLoaded) return;
        try {
            await signIn.authenticateWithRedirect({
                strategy: "oauth_discord",
                redirectUrl: "/sso-callback",
                redirectUrlComplete: `/invite/${code}/activate`,
            });
        } catch (err) {
            console.error("Login failed:", err);
        }
    };

    const isInvalid = validation !== undefined && !validation.valid;

    return (
        <div className="invite-root">
            <div className="invite-bg" />
            <div className="invite-grid" />
            <div className="invite-orb invite-orb-1" />
            <div className="invite-orb invite-orb-2" />
            <div className="invite-orb invite-orb-3" />

            <h1 className="invite-main-title z-10">AI PLAY GUILD</h1>

            <main className="invite-card-wrap">
                {isInvalid ? (
                    <>
                        <h2 className="invite-heading">無効なリンク</h2>
                        <p className="invite-sub">
                            {validation?.reason === "max_redemptions"
                                ? "このリンクの使用回数が上限に達しました。"
                                : validation?.reason === "expired"
                                  ? "このリンクの有効期限が切れています。"
                                  : "このリンクは無効です。"}
                        </p>
                        <a href="/" className="invite-home-link">
                            ホームへ戻る
                        </a>
                    </>
                ) : (
                    <>
                        <div className="invite-badge-wrap">
                            <Gift className="w-4 h-4" />
                            <span>noteマガジン読者限定</span>
                        </div>

                        <h2 className="invite-heading">特別ご招待</h2>
                        <p className="invite-sub">1ヶ月間無料でAI PLAY GUILDをお試しいただけます</p>

                        <div className="invite-features">
                            {[
                                "超実践型ハンズオン（ライブ＆アーカイブ）",
                                "独自学習管理システム利用権",
                                "Discordコミュニティ参加権",
                                "ハッカソンへの参加・フィードバック",
                            ].map((feature, i) => (
                                <div key={i} className="invite-feature-item">
                                    <div className="invite-check-icon">
                                        <Check className="w-3.5 h-3.5 text-white" />
                                    </div>
                                    {feature}
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={handleDiscordLogin}
                            disabled={!isLoaded || validation === undefined}
                            className="invite-submit-btn"
                        >
                            <svg
                                width="22"
                                height="22"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                aria-hidden="true"
                                style={{ flexShrink: 0 }}
                            >
                                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.001.013.01.027.021.035a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                            </svg>
                            Discordで無料体験を始める
                        </button>

                        <p className="invite-note">※ 無料体験終了後、自動で課金されることはありません</p>
                    </>
                )}

                <div className="invite-footer-links">
                    <a href="/terms" className="invite-footer-link">
                        利用規約
                    </a>
                    <span className="invite-footer-dot">·</span>
                    <a href="/privacy" className="invite-footer-link">
                        プライバシーポリシー
                    </a>
                </div>
            </main>

            <style>{`
                .invite-root {
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
                .invite-bg {
                    position: absolute; inset: 0;
                    background:
                        radial-gradient(ellipse 70% 55% at 10% 0%, rgba(56,189,248,0.18) 0%, transparent 60%),
                        radial-gradient(ellipse 55% 45% at 90% 100%, rgba(6,182,212,0.12) 0%, transparent 60%),
                        radial-gradient(ellipse 80% 70% at 50% 50%, #f0f9ff 0%, #e0f2fe 100%);
                    z-index: 0; pointer-events: none;
                }
                .invite-grid {
                    position: absolute; inset: 0;
                    background-image:
                        linear-gradient(rgba(14,165,233,0.07) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(14,165,233,0.07) 1px, transparent 1px);
                    background-size: 56px 56px;
                    z-index: 1;
                    mask-image: radial-gradient(ellipse 65% 65% at 50% 50%, black, transparent);
                    pointer-events: none;
                }
                .invite-orb { position: absolute; border-radius: 50%; filter: blur(80px); z-index: 0; animation: invite-orb-float 12s ease-in-out infinite; pointer-events: none; }
                .invite-orb-1 { width: 380px; height: 380px; background: radial-gradient(circle, rgba(56,189,248,0.22) 0%, transparent 70%); top: -100px; left: -100px; }
                .invite-orb-2 { width: 300px; height: 300px; background: radial-gradient(circle, rgba(6,182,212,0.16) 0%, transparent 70%); bottom: -60px; right: -60px; animation-delay: -5s; }
                .invite-orb-3 { width: 220px; height: 220px; background: radial-gradient(circle, rgba(96,165,250,0.12) 0%, transparent 70%); top: 45%; right: 8%; animation-delay: -9s; }
                @keyframes invite-orb-float {
                    0%, 100% { transform: translateY(0) scale(1); }
                    50% { transform: translateY(-28px) scale(1.04); }
                }

                .invite-card-wrap {
                    position: relative; z-index: 10;
                    width: 100%; max-width: 460px;
                    padding: 2.5rem 2rem 2rem;
                    display: flex; flex-direction: column; align-items: center; gap: 1.1rem;
                    background: rgba(255,255,255,0.95);
                    border: 1px solid rgba(14,165,233,0.18);
                    border-radius: 28px;
                    box-shadow: 0 0 0 1px rgba(14,165,233,0.08), 0 24px 60px rgba(14,165,233,0.12), 0 4px 16px rgba(0,0,0,0.05);
                    animation: invite-card-in 0.65s cubic-bezier(0.16,1,0.3,1) forwards;
                }
                @keyframes invite-card-in {
                    from { opacity: 0; transform: translateY(28px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }

                .invite-main-title {
                    font-family: 'Noto Sans JP', sans-serif;
                    font-size: clamp(2rem, 8vw, 3.4rem);
                    font-weight: 200;
                    color: #0c1a2e;
                    letter-spacing: 0.12em;
                    line-height: 1.15;
                    text-transform: uppercase;
                    margin-bottom: 3rem;
                    text-align: center;
                }

                .invite-badge-wrap {
                    display: inline-flex; align-items: center; gap: 0.5rem;
                    padding: 0.4rem 1rem; border-radius: 999px;
                    background: linear-gradient(135deg, rgba(56,189,248,0.15), rgba(6,182,212,0.10));
                    border: 1px solid rgba(14,165,233,0.28);
                    color: #0ea5e9; font-size: 0.75rem; font-weight: 700;
                    letter-spacing: 0.06em;
                }

                .invite-heading {
                    font-size: 2rem; font-weight: 700; color: #0c1a2e;
                    letter-spacing: -0.02em; margin: 0; text-align: center;
                }
                .invite-sub {
                    font-size: 0.85rem; color: #64748b; margin: -0.3rem 0 0; text-align: center;
                }

                .invite-features {
                    width: 100%; display: flex; flex-direction: column; gap: 0.7rem;
                    padding: 0.5rem 0;
                }
                .invite-feature-item {
                    display: flex; align-items: center; gap: 0.75rem;
                    font-size: 0.85rem; font-weight: 500; color: #374151;
                }
                .invite-check-icon {
                    width: 22px; height: 22px; border-radius: 50%;
                    background: linear-gradient(135deg, #38bdf8, #06b6d4);
                    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
                }

                .invite-submit-btn {
                    display: flex; align-items: center; gap: 0.75rem;
                    padding: 0.9rem 1.5rem; width: 100%; justify-content: center;
                    font-size: 1.05rem; font-weight: 700;
                    background: linear-gradient(135deg, #38bdf8, #06b6d4);
                    color: #fff; border-radius: 14px; border: none;
                    cursor: pointer;
                    transition: opacity 0.2s, transform 0.2s;
                }
                .invite-submit-btn:hover { opacity: 0.88; transform: translateY(-1px); }
                .invite-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

                .invite-note {
                    font-size: 0.75rem; color: #9ca3af; text-align: center;
                }
                .invite-home-link {
                    color: #0ea5e9; font-weight: 600; text-decoration: none; font-size: 0.9rem;
                }
                .invite-home-link:hover { text-decoration: underline; }

                .invite-footer-links {
                    display: flex; align-items: center; gap: 0.6rem; margin-top: 0.1rem;
                }
                .invite-footer-link { font-size: 0.72rem; color: #a0c8dc; text-decoration: none; transition: color 0.2s; }
                .invite-footer-link:hover { color: #0ea5e9; }
                .invite-footer-dot { color: #c8e6f2; font-size: 0.7rem; }

                @media (max-width: 500px) {
                    .invite-card-wrap { margin: 1rem; padding: 2rem 1.25rem; border-radius: 20px; }
                    .invite-heading { font-size: 1.6rem; }
                    .invite-main-title { font-size: 2rem; }
                }
            `}</style>
        </div>
    );
}

export default function InvitePage() {
    return (
        <Suspense>
            <InviteContent />
        </Suspense>
    );
}
