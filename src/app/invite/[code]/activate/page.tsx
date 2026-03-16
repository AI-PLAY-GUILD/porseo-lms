"use client";

import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function ActivateContent() {
    const { code } = useParams<{ code: string }>();
    const { isSignedIn, isLoaded } = useAuth();
    const router = useRouter();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (!isLoaded) return;
        if (!isSignedIn) {
            router.replace(`/invite/${code}`);
            return;
        }

        const activate = async () => {
            try {
                const res = await fetch("/api/activate-note-trial", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ promoCode: code }),
                });

                if (res.ok) {
                    setStatus("success");
                    setTimeout(() => router.push("/dashboard"), 2000);
                } else {
                    const data = await res.json();
                    setStatus("error");
                    setErrorMessage(data.error || "トライアルの有効化に失敗しました");
                }
            } catch {
                setStatus("error");
                setErrorMessage("ネットワークエラーが発生しました");
            }
        };

        activate();
    }, [isLoaded, isSignedIn, code, router]);

    return (
        <div className="activate-root">
            <div className="activate-bg" />
            <div className="activate-grid" />

            <main className="activate-card-wrap">
                {status === "loading" && (
                    <>
                        <div className="activate-spinner" />
                        <h2 className="activate-heading">トライアルを有効化中...</h2>
                        <p className="activate-sub">しばらくお待ちください</p>
                    </>
                )}
                {status === "success" && (
                    <>
                        <div className="activate-success-icon">✓</div>
                        <h2 className="activate-heading">トライアル開始！</h2>
                        <p className="activate-sub">30日間の無料体験が始まりました。ダッシュボードへ移動します...</p>
                    </>
                )}
                {status === "error" && (
                    <>
                        <div className="activate-error-icon">!</div>
                        <h2 className="activate-heading">エラー</h2>
                        <p className="activate-sub">{errorMessage}</p>
                        <a href={`/invite/${code}`} className="activate-retry-link">
                            戻る
                        </a>
                    </>
                )}
            </main>

            <style>{`
                .activate-root {
                    min-height: 100vh; display: flex; flex-direction: column;
                    align-items: center; justify-content: center;
                    position: relative; overflow: hidden;
                    background: #f0f9ff; font-family: 'Noto Sans JP', sans-serif;
                }
                .activate-bg {
                    position: absolute; inset: 0;
                    background: radial-gradient(ellipse 80% 70% at 50% 50%, #f0f9ff 0%, #e0f2fe 100%);
                    z-index: 0; pointer-events: none;
                }
                .activate-grid {
                    position: absolute; inset: 0;
                    background-image:
                        linear-gradient(rgba(14,165,233,0.07) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(14,165,233,0.07) 1px, transparent 1px);
                    background-size: 56px 56px; z-index: 1;
                    mask-image: radial-gradient(ellipse 65% 65% at 50% 50%, black, transparent);
                    pointer-events: none;
                }
                .activate-card-wrap {
                    position: relative; z-index: 10;
                    width: 100%; max-width: 420px;
                    padding: 3rem 2rem;
                    display: flex; flex-direction: column; align-items: center; gap: 1rem;
                    background: rgba(255,255,255,0.95);
                    border: 1px solid rgba(14,165,233,0.18);
                    border-radius: 28px;
                    box-shadow: 0 0 0 1px rgba(14,165,233,0.08), 0 24px 60px rgba(14,165,233,0.12);
                    animation: activate-in 0.65s cubic-bezier(0.16,1,0.3,1) forwards;
                }
                @keyframes activate-in {
                    from { opacity: 0; transform: translateY(28px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                .activate-heading { font-size: 1.5rem; font-weight: 700; color: #0c1a2e; text-align: center; }
                .activate-sub { font-size: 0.85rem; color: #64748b; text-align: center; }
                .activate-spinner {
                    width: 48px; height: 48px; border: 3px solid #e0f2fe;
                    border-top-color: #38bdf8; border-radius: 50%;
                    animation: activate-spin 0.8s linear infinite;
                }
                @keyframes activate-spin { to { transform: rotate(360deg); } }
                .activate-success-icon {
                    width: 64px; height: 64px; border-radius: 50%;
                    background: linear-gradient(135deg, #38bdf8, #06b6d4);
                    color: white; font-size: 2rem; font-weight: 700;
                    display: flex; align-items: center; justify-content: center;
                }
                .activate-error-icon {
                    width: 64px; height: 64px; border-radius: 50%;
                    background: #fecaca; color: #dc2626; font-size: 2rem; font-weight: 700;
                    display: flex; align-items: center; justify-content: center;
                }
                .activate-retry-link {
                    color: #0ea5e9; font-weight: 600; text-decoration: none; font-size: 0.9rem;
                    margin-top: 0.5rem;
                }
                .activate-retry-link:hover { text-decoration: underline; }
            `}</style>
        </div>
    );
}

export default function ActivatePage() {
    return (
        <Suspense>
            <ActivateContent />
        </Suspense>
    );
}
