"use client";

import { useSignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function LoginPage() {
    const { signIn, isLoaded } = useSignIn();

    const handleDiscordLogin = async () => {
        if (!isLoaded) return;
        try {
            await signIn.authenticateWithRedirect({
                strategy: "oauth_discord",
                redirectUrl: "/sso-callback",
                redirectUrlComplete: "/dashboard",
            });
        } catch (err) {
            console.error("Login failed:", err);
        }
    };

    return (
        <div className="auth-root">
            <div className="auth-bg" />
            <div className="auth-grid" />
            <div className="auth-orb auth-orb-1" />
            <div className="auth-orb auth-orb-2" />
            <div className="auth-orb auth-orb-3" />

            {/* Title (Outside the card) */}
            <h1 className="auth-main-title z-10">AI PLAY GUILD</h1>

            <main className="auth-card-wrap">
                <h2 className="auth-heading">ログイン</h2>
                <p className="auth-sub">おかえりなさい！</p>

                {/* Custom Sign-In Button */}
                <div
                    className="auth-clerk-wrap"
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "1rem" }}
                >
                    <button
                        onClick={handleDiscordLogin}
                        disabled={!isLoaded}
                        className="auth-submit-btn"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            padding: "0.9rem 1.5rem",
                            width: "100%",
                            justifyContent: "center",
                            fontSize: "1.05rem",
                            cursor: isLoaded ? "pointer" : "not-allowed",
                        }}
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
                        Discordで続ける
                    </button>
                    <div style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.85rem" }}>
                        <span style={{ color: "#6b7280" }}>アカウントをお持ちではありませんか？ </span>
                        <a href="/join" style={{ fontWeight: "bold", color: "#0ea5e9", textDecoration: "none" }}>
                            新規登録はこちら
                        </a>
                    </div>
                </div>

                <div className="auth-footer-links">
                    <a href="/terms" className="auth-footer-link">
                        利用規約
                    </a>
                    <span className="auth-footer-dot">·</span>
                    <a href="/privacy" className="auth-footer-link">
                        プライバシーポリシー
                    </a>
                </div>
            </main>

            <div className="z-10 mt-6">
                <a
                    href="/"
                    className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-2 rotate-180"
                    >
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                    ホームへ戻る
                </a>
            </div>

            {process.env.NODE_ENV === "development" && (
                <Link
                    href="/dev-login"
                    className="z-10 mt-3 text-sm text-amber-600 hover:text-amber-800 transition-colors"
                >
                    開発用ログイン →
                </Link>
            )}

            <style>{`
                .auth-root {
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
                .auth-bg {
                    position: absolute;
                    inset: 0;
                    background:
                        radial-gradient(ellipse 70% 55% at 10% 0%, rgba(56,189,248,0.18) 0%, transparent 60%),
                        radial-gradient(ellipse 55% 45% at 90% 100%, rgba(6,182,212,0.12) 0%, transparent 60%),
                        radial-gradient(ellipse 80% 70% at 50% 50%, #f0f9ff 0%, #e0f2fe 100%);
                    z-index: 0;
                    pointer-events: none;
                }
                .auth-grid {
                    position: absolute;
                    inset: 0;
                    background-image:
                        linear-gradient(rgba(14,165,233,0.07) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(14,165,233,0.07) 1px, transparent 1px);
                    background-size: 56px 56px;
                    z-index: 1;
                    mask-image: radial-gradient(ellipse 65% 65% at 50% 50%, black, transparent);
                    pointer-events: none;
                }
                .auth-orb {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(80px);
                    z-index: 0;
                    animation: auth-orb-float 12s ease-in-out infinite;
                    pointer-events: none;
                }
                .auth-orb-1 {
                    width: 380px; height: 380px;
                    background: radial-gradient(circle, rgba(56,189,248,0.22) 0%, transparent 70%);
                    top: -100px; left: -100px;
                }
                .auth-orb-2 {
                    width: 300px; height: 300px;
                    background: radial-gradient(circle, rgba(6,182,212,0.16) 0%, transparent 70%);
                    bottom: -60px; right: -60px;
                    animation-delay: -5s;
                }
                .auth-orb-3 {
                    width: 220px; height: 220px;
                    background: radial-gradient(circle, rgba(96,165,250,0.12) 0%, transparent 70%);
                    top: 45%; right: 8%;
                    animation-delay: -9s;
                }
                @keyframes auth-orb-float {
                    0%, 100% { transform: translateY(0) scale(1); }
                    50% { transform: translateY(-28px) scale(1.04); }
                }

                .auth-card-wrap {
                    position: relative;
                    z-index: 10;
                    width: 100%;
                    max-width: 460px;
                    padding: 2.5rem 2rem 2rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1.1rem;
                    background: rgba(255,255,255,0.85);
                    border: 1px solid rgba(14,165,233,0.18);
                    border-radius: 28px;
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    box-shadow:
                        0 0 0 1px rgba(14,165,233,0.08),
                        0 24px 60px rgba(14,165,233,0.12),
                        0 4px 16px rgba(0,0,0,0.05);
                    animation: auth-card-in 0.65s cubic-bezier(0.16,1,0.3,1) both;
                }
                @keyframes auth-card-in {
                    from { opacity: 0; transform: translateY(28px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }

                .auth-main-title {
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

                .auth-heading {
                    font-family: 'Playfair Display', 'Noto Sans JP', serif;
                    font-size: 2.5rem;
                    font-weight: 700;
                    color: #0c1a2e;
                    letter-spacing: -0.02em;
                    margin: 0;
                    text-align: center;
                }
                .auth-sub {
                    font-size: 0.85rem;
                    color: #94c8e0;
                    margin: -0.5rem 0 0;
                }



                .auth-clerk-wrap { width: 100%; }
                .auth-clerk-card {
                    background: #ffffff !important;
                    box-shadow: none !important;
                    border: none !important;
                    padding: 0 !important;
                    width: 100% !important;
                }
                .auth-social-btn {
                    background: #f0f9ff !important;
                    border: 1px solid #bae6fd !important;
                    color: #0c1a2e !important;
                    transition: background 0.2s, border-color 0.2s !important;
                }
                .auth-social-btn:hover {
                    background: #e0f2fe !important;
                    border-color: #7dd3fc !important;
                }
                .auth-input {
                    background: #f0f9ff !important;
                    border: 1px solid #bae6fd !important;
                    color: #0c1a2e !important;
                    border-radius: 10px !important;
                }
                .auth-input:focus {
                    border-color: rgba(14,165,233,0.55) !important;
                    box-shadow: 0 0 0 3px rgba(14,165,233,0.12) !important;
                    outline: none !important;
                }
                .auth-submit-btn {
                    background: linear-gradient(135deg, #38bdf8, #06b6d4) !important;
                    color: #fff !important;
                    font-weight: 700 !important;
                    border-radius: 12px !important;
                    border: none !important;
                    letter-spacing: 0.02em !important;
                    transition: opacity 0.2s, transform 0.2s !important;
                }
                .auth-submit-btn:hover { opacity: 0.88 !important; transform: translateY(-1px) !important; }
                .auth-clerk-footer { display: none !important; }

                .auth-footer-links {
                    display: flex; align-items: center; gap: 0.6rem; margin-top: 0.1rem;
                }
                .auth-footer-link {
                    font-size: 0.72rem; color: #a0c8dc; text-decoration: none; transition: color 0.2s;
                }
                .auth-footer-link:hover { color: #0ea5e9; }
                .auth-footer-dot { color: #c8e6f2; font-size: 0.7rem; }

                @media (max-width: 500px) {
                    .auth-card-wrap { margin: 1rem; padding: 2rem 1.25rem; border-radius: 20px; }
                    .auth-heading { font-size: 2rem; }
                    .auth-main-title { font-size: 2rem; }
                }
            `}</style>
        </div>
    );
}
