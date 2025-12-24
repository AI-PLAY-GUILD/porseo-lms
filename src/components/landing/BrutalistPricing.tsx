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
        "全ての動画コンテンツ見放題",
        "Discordコミュニティへの参加権",
        "月1回のオンラインミートアップ",
        "ソースコードのダウンロード",
        "AIツールの割引特典",
        "優先サポート"
    ];

    return (
        <section id="pricing" className="py-24 bg-pop-yellow border-b-4 border-black relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full border-4 border-black -mr-32 -mt-32 opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-pop-red rounded-full border-4 border-black -ml-32 -mb-32 opacity-50"></div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-3xl p-8 md:p-16 text-center border-4 border-black brutal-shadow-lg relative">

                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-pop-red text-white px-8 py-2 rounded-full border-4 border-black font-black text-xl transform rotate-2">
                            POPULAR CHOICE
                        </div>

                        <h2 className="text-3xl sm:text-5xl md:text-7xl font-black text-black mb-6 uppercase tracking-tighter mt-4">
                            Simple Pricing
                        </h2>
                        <p className="text-xl font-bold text-black mb-12">
                            追加料金なし。全ての機能にアクセス。
                        </p>

                        <div className="flex items-baseline justify-center gap-2 mb-12">
                            <span className="text-5xl sm:text-7xl md:text-8xl font-black text-black">¥980</span>
                            <span className="text-xl sm:text-2xl font-bold text-black">/ month</span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-x-12 gap-y-6 text-left max-w-2xl mx-auto mb-12 bg-cream p-8 rounded-xl border-4 border-black">
                            {benefits.map((benefit, index) => (
                                <div key={index} className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full bg-pop-green border-2 border-black flex items-center justify-center flex-shrink-0">
                                        <Check className="w-5 h-5 text-black" />
                                    </div>
                                    <span className="text-black font-bold text-lg">{benefit}</span>
                                </div>
                            ))}
                        </div>

                        <Button asChild size="lg" className="w-full max-w-md h-16 sm:h-20 text-xl sm:text-2xl font-black rounded-xl bg-black text-white hover:bg-pop-purple hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all shadow-[8px_8px_0px_0px_#FF5757] border-4 border-transparent hover:border-black">
                            <Link href="/join">
                                START YOUR JOURNEY NOW 🚀
                            </Link>
                        </Button>
                        <p className="mt-6 text-base font-bold text-gray-500">
                            いつでもキャンセル可能です。
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
