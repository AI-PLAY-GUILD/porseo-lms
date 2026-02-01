"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { WaveButton } from "@/components/ui/wave-button";

// Simple CountUp Hook
const useCountUp = (end: number, duration: number = 2000) => {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.1 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!isVisible) return;
        let startTime: number;
        let animationFrame: number;

        const update = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);

            // Ease out quart
            const ease = 1 - Math.pow(1 - percentage, 4);

            setCount(Math.floor(end * ease));

            if (progress < duration) {
                animationFrame = requestAnimationFrame(update);
            } else {
                setCount(end);
            }
        };

        animationFrame = requestAnimationFrame(update);
        return () => cancelAnimationFrame(animationFrame);
    }, [end, duration, isVisible]);

    return { count, ref };
};

const StatItem = ({ end, label, suffix = "", prefix = "", hasBorder = false }: { end: number, label: string, suffix?: string, prefix?: string, hasBorder?: boolean }) => {
    const { count, ref } = useCountUp(end);

    return (
        <div ref={ref} className={`flex flex-col items-center justify-center p-4 ${hasBorder ? 'md:border-l-2 md:border-r-2 border-gray-200' : ''}`}>
            <span className="text-5xl md:text-7xl font-bold mb-4 tracking-tight" style={{ fontFamily: 'var(--font-body)' }}>
                {prefix}{count.toLocaleString()}{suffix}
            </span>
            <span className="text-lg md:text-xl font-bold text-gray-500">{label}</span>
        </div>
    );
};

export function BrutalistWhy() {
    return (
        <section className="py-16 md:py-24 bg-white text-black relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10 text-center">

                {/* Intro Section */}
                <h2 className="text-3xl sm:text-5xl md:text-6xl font-black mb-8 tracking-tighter" style={{ fontFamily: 'var(--font-jp)' }}>
                    なぜ、AI PLAY GUILDなのか
                </h2>
                <p className="max-w-3xl mx-auto text-lg md:text-xl font-bold mb-16 md:mb-20 leading-relaxed text-gray-600">
                    最前線を走る知見と、手を動かすプレイヤーたち。<br className="hidden md:block" />
                    AIの孤独な「勉強」を、伝染する「遊び」へ変えることが私たちのミッションです。
                </p>

                {/* Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-0 max-w-6xl mx-auto mb-16 md:mb-32">
                    <StatItem end={130} label="過去参加人数累計" prefix="+" />
                    <StatItem end={40} label="アーカイブ講座数" prefix="+" hasBorder={true} />
                    <StatItem end={100000} label="運営陣の総フォロワー数" prefix="+" />
                </div>

                {/* Live Hands-on Section (New) */}
                <div className="text-left max-w-6xl mx-auto py-12 grid grid-cols-1 lg:grid-cols-2 items-center gap-12">
                    <div className="relative z-10">
                        <h3 className="text-3xl sm:text-4xl md:text-6xl font-black mb-8 tracking-tighter leading-tight" style={{ fontFamily: 'var(--font-jp)' }}>
                            週3回の<br />ライブ講座。<br />「最新」を発信。
                        </h3>
                        <p className="text-lg md:text-xl font-bold text-gray-600 leading-relaxed">
                            AIの進化速度は「日」単位。<br />
                            週3回のライブハンズオンで、<br className="hidden md:block" />
                            最新技術をその場で使える様にします。
                        </p>
                    </div>

                    {/* Animation Column */}
                    <div className="flex justify-center lg:justify-end">
                        <div className="live-loader-card">
                            <div className="live-loader">
                                <p className="whitespace-nowrap">play with...</p>
                                <div className="live-words">
                                    <span className="live-word">ChatGPT</span>
                                    <span className="live-word">Claude</span>
                                    <span className="live-word">Gemini</span>
                                    <span className="live-word">Cursor</span>
                                    <span className="live-word">v0</span>
                                    <span className="live-word">Replit</span>
                                    <span className="live-word">Suno</span>
                                    <span className="live-word">Midjourney</span>
                                    <span className="live-word">ChatGPT</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Price Comparison Section */}
                <div className="mt-32 max-w-5xl mx-auto px-4" style={{ fontFamily: 'var(--font-jp)' }}>
                    <h3 className="text-3xl sm:text-5xl font-bold mb-4 text-center">
                        お財布に優しい価格設定
                    </h3>
                    <p className="text-lg md:text-xl font-bold text-gray-500 text-center mb-16">
                        AIで遊びながら学ぶなら、ここ以外ありえない。
                    </p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-6">
                        {/* Competitor A - Left */}
                        <div className="w-full md:w-1/3 p-8 text-center opacity-60">
                            <h4 className="font-bold text-lg mb-4 text-gray-800 font-[family-name:var(--font-jp)]">某AIコミュニティ</h4>
                            <p className="text-sm font-bold text-gray-500 mb-2">月額プラン</p>
                            <p className="text-3xl font-bold text-gray-400" style={{ fontFamily: 'Arial, sans-serif' }}>¥5,980</p>
                        </div>

                        {/* AI PLAY GUILD - Center (Featured) */}
                        <div className="w-full md:w-1/3 bg-white text-black p-8 relative z-10">
                            <div className="mb-6">
                                <div className="flex justify-center mb-2">
                                    <Image
                                        src="/images/pricing-logo-v3.png"
                                        alt="AI PLAY GUILD Logo"
                                        width={60}
                                        height={60}
                                        className="object-contain"
                                    />
                                </div>
                                <h4 className="font-light text-2xl mb-4 text-slate-900 tracking-tight font-[family-name:var(--font-jp)]">AI PLAY GUILD</h4>
                                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                                    <div className="inline-block border border-black text-black text-xs font-bold px-3 py-1 bg-gray-100">
                                        入退会自由
                                    </div>
                                    <div className="inline-block border border-black text-black text-xs font-bold px-3 py-1 bg-gray-100">
                                        入会金/解約金0円
                                    </div>
                                </div>
                            </div>

                            <div className="mb-8 border-b-2 border-dashed border-gray-200 pb-8">
                                <p className="text-sm font-bold text-gray-500 mb-2">月額プラン</p>
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className="text-5xl font-bold" style={{ fontFamily: 'Arial, sans-serif', fontVariantNumeric: 'lining-nums' }}>¥4,000</span>
                                </div>
                            </div>

                            <div className="space-y-3 text-left pl-4 mb-8">
                                <p className="text-sm font-bold flex items-center gap-3">
                                    <span className="w-3 h-3 bg-black"></span>
                                    週3回 ライブハンズオン
                                </p>
                                <p className="text-sm font-bold flex items-center gap-3">
                                    <span className="w-3 h-3 bg-black"></span>
                                    アーカイブ見放題
                                </p>
                                <p className="text-sm font-bold flex items-center gap-3">
                                    <span className="w-3 h-3 bg-black"></span>
                                    独自の学習管理プラットフォーム
                                </p>
                                <p className="text-sm font-bold flex items-center gap-3">
                                    <span className="w-3 h-3 bg-black"></span>
                                    専用Discordコミュニティ
                                </p>
                                <p className="text-sm font-bold flex items-center gap-3">
                                    <span className="w-3 h-3 bg-black"></span>
                                    ハッカソン参加権
                                </p>
                            </div>

                            <div>
                                <WaveButton
                                    text="今すぐ参加する"
                                    hoverText="CHECK！"
                                    className="w-full h-12 rounded-md border-2 border-black bg-black text-white hover:bg-gray-800"
                                    href="/join"
                                />
                            </div>
                        </div>

                        {/* Competitor S - Right */}
                        <div className="w-full md:w-1/3 p-8 text-center opacity-60">
                            <h4 className="font-bold text-lg mb-4 text-gray-800 font-[family-name:var(--font-jp)]">某AIスクール</h4>
                            <p className="text-sm font-bold text-gray-500 mb-2">月額プラン</p>
                            <p className="text-3xl font-bold text-gray-400" style={{ fontFamily: 'Arial, sans-serif' }}>¥21,780</p>
                        </div>
                    </div>

                    <p className="mt-16 text-xs font-bold text-gray-400 text-center">
                        ※2026年2月時点の市場調査に基づく比較です。
                    </p>
                </div>

            </div>
        </section>
    );
}
