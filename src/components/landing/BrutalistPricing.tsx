"use client";

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
        <section id="pricing" className="py-24 bg-background relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -z-10"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[100px] -z-10"></div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-3xl p-8 md:p-16 text-center shadow-soft border border-border/50 relative overflow-hidden">

                        {/* Gradient Border Effect */}
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-accent"></div>

                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-accent text-white px-8 py-2 rounded-full shadow-lg shadow-primary/30 font-bold text-sm tracking-wide uppercase">
                            JOIN THE COMMUNITY
                        </div>

                        <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-foreground mb-6 tracking-tight mt-8">
                            Membership
                        </h2>
                        <p className="text-xl font-medium text-muted-foreground mb-12">
                            一緒にAIで楽しみながら成長しましょう！
                        </p>

                        <div className="flex items-baseline justify-center gap-2 mb-12">
                            <span className="text-5xl sm:text-7xl md:text-8xl font-extrabold text-foreground tracking-tight">¥4,000</span>
                            <span className="text-xl sm:text-2xl font-medium text-muted-foreground">/ month</span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-x-12 gap-y-6 text-left max-w-2xl mx-auto mb-12 bg-secondary/30 p-8 rounded-2xl border border-border/50">
                            {benefits.map((benefit, index) => (
                                <div key={index} className="flex items-center gap-4">
                                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                                        <Check className="w-4 h-4" />
                                    </div>
                                    <span className="text-foreground font-medium text-base">{benefit}</span>
                                </div>
                            ))}
                        </div>

                        <Button asChild size="lg" variant="gradient" className="w-full max-w-md h-16 sm:h-20 text-xl sm:text-2xl font-bold rounded-full shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-105 transition-all duration-300">
                            <Link href="/join">今すぐ参加 🚀</Link>
                        </Button>
                        <p className="mt-8 text-sm font-medium text-muted-foreground">
                            入退会は自由です。自分のペースで楽しみましょう。
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
