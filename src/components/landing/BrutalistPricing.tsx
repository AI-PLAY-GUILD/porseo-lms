"use client";

import { ParticleBackground } from "./particle-background";
import { Button } from "@/components/ui/button";
import { Check, Star } from "lucide-react";
import Link from "next/link";

interface BrutalistPricingProps {
    handleCheckout: () => void;
    checkoutLoading: boolean;
}

export function BrutalistPricing({ handleCheckout, checkoutLoading }: BrutalistPricingProps) {
    const benefits = [
        "超実践型ハンズオン（ライブ＆アーカイブ）",
        "独自学習管理システム利用権",
        "Discordコミュニティ参加権",
        "ハッカソンへの参加・フィードバック",
        "メンバー限定のソースコード共有"
    ];

    return (
        <section id="pricing" className="py-32 relative overflow-hidden bg-white">
            <div className="absolute inset-0 z-0 opacity-50 pointer-events-none">
                <ParticleBackground />
            </div>
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-3xl mx-auto">
                    <div className="glass-panel rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">

                        {/* Gradient Border Effect */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent opacity-50"></div>

                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md border border-white/20 text-foreground px-8 py-2 rounded-full font-light text-sm tracking-widest uppercase">
                            JOIN THE COMMUNITY
                        </div>

                        <h2 className="text-4xl sm:text-6xl md:text-7xl font-thin text-foreground mb-6 tracking-tighter mt-8">
                            Membership
                        </h2>
                        <p className="text-xl font-light text-muted-foreground mb-12">
                            一緒にAIで楽しみながら成長しましょう！
                        </p>

                        <div className="flex items-baseline justify-center gap-2 mb-12">
                            <span className="text-6xl sm:text-8xl md:text-9xl font-thin text-foreground tracking-tighter">¥4,000</span>
                            <span className="text-xl sm:text-2xl font-light text-muted-foreground">/ month</span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-x-12 gap-y-6 text-left max-w-2xl mx-auto mb-12 glass-panel-subtle p-8 rounded-2xl">
                            {benefits.map((benefit, index) => (
                                <div key={index} className="flex items-center gap-4">
                                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary border border-primary/20">
                                        <Check className="w-3 h-3" />
                                    </div>
                                    <span className="text-foreground font-light text-base">{benefit}</span>
                                </div>
                            ))}
                        </div>

                        <Button asChild size="lg" className="w-full max-w-md h-16 sm:h-20 text-xl sm:text-2xl font-light rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 hover:border-white/30 hover:shadow-[0_0_30px_rgba(19,91,236,0.3)] transition-all duration-300 text-foreground">
                            <Link href="/join">今すぐ参加 🚀</Link>
                        </Button>
                        <p className="mt-8 text-sm font-light text-muted-foreground">
                            入退会は自由です。自分のペースで楽しみましょう。
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
