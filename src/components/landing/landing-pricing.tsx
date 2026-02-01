"use client";

import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import Link from "next/link";

interface LandingPricingProps {
    handleCheckout: () => void;
    checkoutLoading: boolean;
}

export function LandingPricing({ handleCheckout, checkoutLoading }: LandingPricingProps) {
    const benefits = [
        "全ての動画コンテンツ見放題",
        "Discordコミュニティへの参加権",
        "月1回のオンラインミートアップ",
        "ソースコードのダウンロード",
        "AIツールの割引特典",
        "優先サポート"
    ];

    return (
        <section id="pricing" className="py-16 md:py-24 relative z-10">
            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto bg-gradient-to-b from-white/10 to-transparent p-[1px] rounded-[40px]">
                    <div className="bg-black/80 backdrop-blur-xl rounded-[39px] p-6 md:p-16 text-center border border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none" />

                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 relative z-10">
                            Simple Pricing
                        </h2>
                        <p className="text-gray-400 mb-12 relative z-10">
                            追加料金なし。全ての機能にアクセスできます。
                        </p>

                        <div className="flex items-baseline justify-center gap-2 mb-12 relative z-10">
                            <span className="text-5xl md:text-6xl font-black text-white">¥980</span>
                            <span className="text-xl text-gray-400">/ month</span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-x-12 gap-y-4 text-left max-w-2xl mx-auto mb-12 relative z-10">
                            {benefits.map((benefit, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                        <Check className="w-3.5 h-3.5 text-blue-400" />
                                    </div>
                                    <span className="text-gray-300">{benefit}</span>
                                </div>
                            ))}
                        </div>

                        <Button asChild size="lg" className="w-full max-w-md h-16 text-xl font-bold rounded-full bg-white text-black hover:bg-gray-200 hover:scale-[1.02] transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] relative z-10">
                            <Link href="/join">
                                Start Your Journey Now
                            </Link>
                        </Button>
                        <p className="mt-4 text-sm text-gray-500 relative z-10">
                            いつでもキャンセル可能です。
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
