"use client";

import { useQuery } from "convex/react";
import { ArrowRight, BookOpen, Clock, Trophy } from "lucide-react";
import Link from "next/link";
import { api } from "../../../convex/_generated/api";

export default function TrialExpiredPage() {
    const stats = useQuery(api.dashboard.getStats);

    return (
        <div className="expired-root">
            <div className="expired-bg" />
            <div className="expired-grid" />
            <div className="expired-orb expired-orb-1" />
            <div className="expired-orb expired-orb-2" />

            <main className="expired-card-wrap">
                <h2 className="expired-heading">無料体験期間が終了しました</h2>
                <p className="expired-sub">AI PLAY GUILDをご利用いただきありがとうございます</p>

                {stats && (
                    <div className="expired-stats">
                        <div className="expired-stat">
                            <Clock className="w-5 h-5 text-sky-500" />
                            <div>
                                <p className="expired-stat-value">{stats.totalHours}時間</p>
                                <p className="expired-stat-label">学習時間</p>
                            </div>
                        </div>
                        <div className="expired-stat">
                            <BookOpen className="w-5 h-5 text-sky-500" />
                            <div>
                                <p className="expired-stat-value">{stats.completedCount}本</p>
                                <p className="expired-stat-label">完了動画</p>
                            </div>
                        </div>
                        <div className="expired-stat">
                            <Trophy className="w-5 h-5 text-sky-500" />
                            <div>
                                <p className="expired-stat-value">{stats.rank}</p>
                                <p className="expired-stat-label">ランク</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="expired-divider" />

                <p className="expired-message">
                    引き続きAI PLAY GUILDで学習を続けませんか？
                    <br />
                    月額¥4,000で全コンテンツにアクセスできます。
                </p>

                <Link href="/join" className="expired-cta-btn">
                    <span>有料メンバーになる</span>
                    <ArrowRight className="w-5 h-5" />
                </Link>

                <a href="/" className="expired-home-link">
                    ホームへ戻る
                </a>
            </main>

            <style>{`
                .expired-root {
                    min-height: 100vh; display: flex; flex-direction: column;
                    align-items: center; justify-content: center;
                    position: relative; overflow: hidden;
                    background: #f0f9ff; font-family: 'Noto Sans JP', sans-serif;
                }
                .expired-bg {
                    position: absolute; inset: 0;
                    background: radial-gradient(ellipse 80% 70% at 50% 50%, #f0f9ff 0%, #e0f2fe 100%);
                    z-index: 0; pointer-events: none;
                }
                .expired-grid {
                    position: absolute; inset: 0;
                    background-image:
                        linear-gradient(rgba(14,165,233,0.07) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(14,165,233,0.07) 1px, transparent 1px);
                    background-size: 56px 56px; z-index: 1;
                    mask-image: radial-gradient(ellipse 65% 65% at 50% 50%, black, transparent);
                    pointer-events: none;
                }
                .expired-orb { position: absolute; border-radius: 50%; filter: blur(80px); z-index: 0; pointer-events: none; }
                .expired-orb-1 { width: 350px; height: 350px; background: radial-gradient(circle, rgba(56,189,248,0.18) 0%, transparent 70%); top: -80px; left: -80px; }
                .expired-orb-2 { width: 280px; height: 280px; background: radial-gradient(circle, rgba(6,182,212,0.14) 0%, transparent 70%); bottom: -40px; right: -40px; }

                .expired-card-wrap {
                    position: relative; z-index: 10;
                    width: 100%; max-width: 480px;
                    padding: 3rem 2rem;
                    display: flex; flex-direction: column; align-items: center; gap: 1.2rem;
                    background: rgba(255,255,255,0.95);
                    border: 1px solid rgba(14,165,233,0.18);
                    border-radius: 28px;
                    box-shadow: 0 0 0 1px rgba(14,165,233,0.08), 0 24px 60px rgba(14,165,233,0.12);
                    animation: expired-in 0.65s cubic-bezier(0.16,1,0.3,1) forwards;
                }
                @keyframes expired-in {
                    from { opacity: 0; transform: translateY(28px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }

                .expired-heading { font-size: 1.6rem; font-weight: 700; color: #0c1a2e; text-align: center; }
                .expired-sub { font-size: 0.85rem; color: #94c8e0; text-align: center; margin-top: -0.3rem; }

                .expired-stats {
                    display: flex; gap: 1.5rem; padding: 1rem 0;
                }
                .expired-stat {
                    display: flex; align-items: center; gap: 0.5rem;
                }
                .expired-stat-value { font-size: 1.1rem; font-weight: 700; color: #0c1a2e; }
                .expired-stat-label { font-size: 0.7rem; color: #9ca3af; }

                .expired-divider { width: 100%; height: 1px; background: #e0f2fe; }

                .expired-message {
                    font-size: 0.85rem; color: #64748b; text-align: center; line-height: 1.7;
                }

                .expired-cta-btn {
                    display: flex; align-items: center; gap: 0.5rem;
                    padding: 0.9rem 2rem; width: 100%; justify-content: center;
                    font-size: 1.05rem; font-weight: 700;
                    background: linear-gradient(135deg, #38bdf8, #06b6d4);
                    color: #fff; border-radius: 14px; border: none;
                    text-decoration: none;
                    transition: opacity 0.2s, transform 0.2s;
                }
                .expired-cta-btn:hover { opacity: 0.88; transform: translateY(-1px); }

                .expired-home-link {
                    font-size: 0.8rem; color: #94a3b8; text-decoration: none;
                }
                .expired-home-link:hover { color: #64748b; text-decoration: underline; }

                @media (max-width: 500px) {
                    .expired-card-wrap { margin: 1rem; padding: 2rem 1.25rem; border-radius: 20px; }
                    .expired-heading { font-size: 1.3rem; }
                    .expired-stats { flex-direction: column; gap: 0.8rem; }
                }
            `}</style>
        </div>
    );
}
