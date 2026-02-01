"use client";

import { WaveButton } from "@/components/ui/wave-button";
import { Check } from "lucide-react";

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
        <section id="pricing" className="py-24 bg-white relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-5xl mx-auto">
                    <div className="bg-white overflow-hidden border-4 border-black relative rounded-lg">
                        <div className="flex flex-col md:flex-row">
                            {/* Left Column: Info & Action */}
                            <div className="p-8 md:p-12 w-full md:w-1/2 flex flex-col justify-center items-start text-left border-b-4 md:border-b-0 md:border-r-4 border-black">
                                <h2 className="text-3xl sm:text-4xl font-bold text-black mb-4 tracking-tighter" style={{ fontFamily: 'var(--font-jp)' }}>
                                    メンバーシップ
                                </h2>
                                <p className="text-lg font-bold text-gray-600 mb-8">
                                    一緒にAIで楽しみながら成長しましょう！
                                </p>


                                <p className="text-sm font-bold text-gray-500 mb-2">月額プラン</p>
                                <div className="flex items-baseline gap-2 mb-8">
                                    <span className="text-5xl sm:text-6xl font-black text-black" style={{ fontFamily: 'Arial, sans-serif' }}>¥4,000</span>
                                </div>

                                <WaveButton
                                    href="/join"
                                    text="今すぐ参加"
                                    hoverText="さあ、始めよう！"
                                    className="w-full md:w-auto h-12 px-8 border-2 border-black"
                                />

                                <p className="mt-6 text-sm font-bold text-gray-400">
                                    入退会自由 / 入会金0円
                                </p>
                            </div>

                            {/* Right Column: Benefits */}
                            <div className="p-8 md:p-12 w-full md:w-1/2 flex flex-col justify-center bg-white">
                                <div className="space-y-6">
                                    {benefits.map((benefit, index) => (
                                        <div key={index} className="flex items-start gap-4">
                                            <div className="mt-1 w-6 h-6 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                                                <Check className="w-4 h-4 text-white" />
                                            </div>
                                            <span className="text-black font-bold text-lg leading-tight">{benefit}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
