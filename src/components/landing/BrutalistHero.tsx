"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Menu, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { LiquidBackground } from "../liquid-background";

interface BrutalistHeroProps {
    isSignedIn: boolean;
    handleCheckout: () => void;
    checkoutLoading: boolean;
}

export function BrutalistHero({ isSignedIn, handleCheckout, checkoutLoading }: BrutalistHeroProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);

    useGSAP(() => {
        gsap.from(titleRef.current, {
            y: 50,
            opacity: 0,
            duration: 1.2,
            ease: "power3.out",
            delay: 0.2
        });
    }, { scope: containerRef });

    return (
        <section ref={containerRef} className="relative w-full h-screen flex flex-col overflow-hidden bg-[#f6f6f8] dark:bg-[#101622] font-sans">
            {/* Animated Liquid Background */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <LiquidBackground />
                {/* Overlay Texture */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none"></div>
            </div>

            {/* Hero Content */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 text-center pb-20">
                <div className="max-w-4xl flex flex-col items-center gap-6 md:gap-8">
                    {/* Headline with Liquid/Distorted Aesthetic */}
                    <h1 ref={titleRef} className="text-6xl md:text-8xl lg:text-9xl font-thin tracking-tighter leading-[0.9] drop-shadow-2xl text-transparent bg-clip-text bg-gradient-to-br from-[#135bec] via-[#44ddff] to-[#135bec] dark:from-white dark:via-[#a5c3ff] dark:to-[#135bec] animate-gradient-x bg-[length:200%_auto]">
                        AI PLAY GUILD
                    </h1>

                    {/* Sub-headline */}
                    <p className="text-slate-600 dark:text-blue-100/80 text-sm md:text-lg font-normal tracking-wide max-w-lg mx-auto leading-relaxed">
                        昨日より、AIに没頭できるコミュニティ
                    </p>

                    {/* CTA Button */}
                    <div className="mt-8">
                        {isSignedIn ? (
                            <Link href="/dashboard">
                                <button className="group relative overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 dark:border-white/10 px-8 py-4 rounded-lg flex items-center gap-3 text-[#135bec] dark:text-white font-bold tracking-wide uppercase text-sm md:text-base hover:bg-[#135bec]/10 dark:hover:bg-[#135bec]/30 hover:border-[#135bec]/50 hover:shadow-[0_0_30px_rgba(19,91,236,0.3)] transition-all duration-300">
                                    <span className="relative z-10">Go to Dashboard</span>
                                    <ArrowRight className="w-5 h-5 relative z-10" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#135bec]/0 via-[#135bec]/10 to-[#135bec]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                </button>
                            </Link>
                        ) : (
                            <Link href="/join">
                                <button className="group relative overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 dark:border-white/10 px-8 py-4 rounded-lg flex items-center gap-3 text-[#135bec] dark:text-white font-bold tracking-wide uppercase text-sm md:text-base hover:bg-[#135bec]/10 dark:hover:bg-[#135bec]/30 hover:border-[#135bec]/50 hover:shadow-[0_0_30px_rgba(19,91,236,0.3)] transition-all duration-300">
                                    <span className="relative z-10">Start Journey</span>
                                    <ArrowRight className="w-5 h-5 relative z-10" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#135bec]/0 via-[#135bec]/10 to-[#135bec]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                </button>
                            </Link>
                        )}
                    </div>
                </div>
            </main>

            {/* Scroll Indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-white">
                <span className="text-[10px] uppercase tracking-[0.2em]">Scroll</span>
                <div className="w-[1px] h-12 bg-gradient-to-b from-transparent via-white to-transparent"></div>
                <ChevronDown className="w-6 h-6 animate-bounce duration-[3000ms]" />
            </div>

            {/* Bottom Gradient for Natural Transition */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-[#f6f6f8] dark:to-[#101622] z-10 pointer-events-none"></div>
        </section>
    );
}
