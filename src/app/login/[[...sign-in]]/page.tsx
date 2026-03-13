"use client";

import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { Suspense } from "react";

function LoginContent() {
    return (
        <div className="auth-root">
            <div className="auth-bg" />
            <div className="auth-grid" />
            <div className="auth-orb auth-orb-1" />
            <div className="auth-orb auth-orb-2" />
            <div className="auth-orb auth-orb-3" />

            <main className="z-10 flex flex-col items-center">
                <div className="mb-8 text-center">
                    <h1 className="auth-main-title">AI PLAY GUILD</h1>
                </div>

                <SignIn
                    routing="path"
                    path="/login"
                    signUpUrl="/join"
                    appearance={{
                        elements: {
                            rootBox: "w-full max-w-[400px]",
                            card: "bg-white/95 shadow-xl border border-sky-100 rounded-2xl w-full",
                            headerTitle: "font-bold text-gray-900",
                            headerSubtitle: "text-gray-500",
                            socialButtonsBlockButton: "border-sky-200 hover:bg-sky-50 transition-colors",
                            formButtonPrimary:
                                "bg-gradient-to-r from-sky-400 to-cyan-500 hover:opacity-90 transition-opacity",
                            footerActionLink: "text-sky-500 hover:text-sky-600 font-semibold",
                        },
                    }}
                />

                <div className="mt-8 flex flex-col items-center gap-4">
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

                    {process.env.NODE_ENV === "development" && (
                        <Link
                            href="/dev-login"
                            className="text-sm text-amber-600 hover:text-amber-800 transition-colors"
                        >
                            開発用ログイン →
                        </Link>
                    )}
                </div>
            </main>

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
                .auth-main-title {
                    font-family: 'Noto Sans JP', sans-serif;
                    font-size: clamp(2rem, 8vw, 3.4rem);
                    font-weight: 200;
                    color: #0c1a2e;
                    letter-spacing: 0.12em;
                    line-height: 1.15;
                    text-transform: uppercase;
                    text-align: center;
                }
                @media (max-width: 500px) {
                    .auth-main-title { font-size: 2rem; }
                }
            `}</style>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense>
            <LoginContent />
        </Suspense>
    );
}
