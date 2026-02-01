"use client";

import { Button } from "@/components/ui/button";
import { WaveButton } from "@/components/ui/wave-button";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { heroContent } from "@/config/landing-content";

interface BrutalistHeroProps {
    isSignedIn: boolean;
    handleCheckout: () => void;
    checkoutLoading: boolean;
}

export function BrutalistHero({ isSignedIn, handleCheckout, checkoutLoading }: BrutalistHeroProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        // Fade in title and buttons
        gsap.from(".hero-content", {
            y: 30,
            opacity: 0,
            duration: 1.2,
            stagger: 0.2,
            ease: "power2.out",
            delay: 0.2
        });

        // Slow rotation for aurora blobs
        gsap.to(".aurora-blob", {
            rotation: 360,
            duration: 25,
            repeat: -1,
            ease: "none",
            transformOrigin: "center center"
        });
    }, { scope: containerRef });

    return (
        <section ref={containerRef} className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-white text-slate-900 pt-10 pb-16 md:py-24">
            <div className="container relative z-10 px-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start lg:items-center mb-12 md:mb-20">
                    {/* Left Column: Text Content */}
                    {/* Left Column: Text Content */}
                    <div className="text-left w-full">
                        {/* Title Row with Mobile 3D Animation */}
                        <div className="flex flex-row items-end justify-start -ml-1 mb-24">
                            <h1 className="hero-content leading-none font-[family-name:var(--font-jp)] shrink-0">
                                <span className="block text-[10vw] sm:text-7xl md:text-8xl font-black text-black tracking-tighter whitespace-nowrap leading-none">
                                    AIで、
                                </span>
                                <span className="block text-[10vw] sm:text-7xl md:text-8xl font-black text-black tracking-tighter whitespace-nowrap leading-none">
                                    遊び倒せ。
                                </span>
                            </h1>
                            {/* Mobile Only 3D Animation - 3x Larger */}
                            <div className="block lg:hidden flex-1 relative h-[160px] xs:h-[200px] mb-4">
                                <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-[240px] h-[240px] flex items-end justify-center pointer-events-none">
                                    <div className="boxes scale-[1.2] origin-bottom pb-4">
                                        <div className="box">
                                            <div></div><div></div><div></div><div></div>
                                        </div>
                                        <div className="box">
                                            <div></div><div></div><div></div><div></div>
                                        </div>
                                        <div className="box">
                                            <div></div><div></div><div></div><div></div>
                                        </div>
                                        <div className="box">
                                            <div></div><div></div><div></div><div></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Buttons - Left Aligned & Horizontal on Mobile */}
                        <div className="hero-content w-full mb-12">
                            {isSignedIn ? (
                                <div className="flex justify-start">
                                    <Button asChild size="lg" className="w-full sm:w-auto h-12 px-8 rounded-full bg-slate-900 text-white text-base font-bold hover:bg-slate-800 hover:scale-105 transition-all shadow-lg shadow-slate-200/50">
                                        <Link href="/dashboard">
                                            Go To Dashboard <ArrowRight className="ml-2 w-5 h-5" />
                                        </Link>
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3 w-full max-w-[400px]">
                                    <div className="w-full">
                                        <WaveButton
                                            href="/join"
                                            text={heroContent.buttons.primary}
                                            hoverText="さあ、始めよう！"
                                            className="w-full h-12 rounded-md text-base"
                                        />
                                    </div>
                                    <Button asChild variant="outline" className="w-full h-12 rounded-md bg-white text-black border-2 border-black hover:bg-black hover:text-white transition-all shadow-md text-base px-0 font-bold">
                                        <Link href="#features">
                                            {heroContent.buttons.secondary}
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Statistics Section - Left Aligned on Mobile */}
                        <div className="hero-content border-t border-slate-200 pt-8 w-full">
                            <div className="flex flex-row justify-start gap-6 sm:gap-12 w-full">
                                <div className="text-left">
                                    <div className="text-2xl sm:text-4xl font-normal text-black mb-1" style={{ fontFamily: 'var(--font-jp)' }}>
                                        週3回
                                    </div>
                                    <div className="text-xs sm:text-sm text-slate-600">ライブハンズオン</div>
                                </div>
                                <div className="text-left">
                                    <div className="text-2xl sm:text-4xl font-normal text-black mb-1" style={{ fontFamily: 'var(--font-jp)' }}>
                                        10万+
                                    </div>
                                    <div className="text-xs sm:text-sm text-slate-600">総フォロワー</div>
                                </div>
                                <div className="text-left">
                                    <div className="text-2xl sm:text-4xl font-normal text-black mb-1" style={{ fontFamily: 'var(--font-jp)' }}>
                                        ¥0
                                    </div>
                                    <div className="text-xs sm:text-sm text-slate-600">入会費</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Logo Image (Desktop Only) */}
                    <div className="hero-content hidden lg:flex justify-center lg:justify-start lg:pl-20 relative">
                        {/* CSS 3D Boxes Animation */}
                        <div className="relative w-[300px] h-[300px] flex items-center justify-center">
                            <div className="boxes scale-[2.5]">
                                <div className="box">
                                    <div></div><div></div><div></div><div></div>
                                </div>
                                <div className="box">
                                    <div></div><div></div><div></div><div></div>
                                </div>
                                <div className="box">
                                    <div></div><div></div><div></div><div></div>
                                </div>
                                <div className="box">
                                    <div></div><div></div><div></div><div></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Moving Gallery (Glassmorphism Light) */}
                {/* Marquee Gallery (Clean Light Mode) */}
                <div className="hero-content w-full max-w-7xl mx-auto py-10 opacity-80 mix-blend-multiply flex justify-center">
                    <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
                        <div className="animate-scroll inline-flex items-center gap-16 min-w-full">
                            {[...heroContent.gallery, ...heroContent.gallery, ...heroContent.gallery].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 group">
                                    <img
                                        src={item.icon}
                                        alt={item.name}
                                        className="w-6 h-6 object-contain opacity-70 group-hover:opacity-100 transition-opacity"
                                        loading="lazy"
                                    />
                                    <span className="text-lg font-bold text-slate-800 tracking-wide whitespace-nowrap">
                                        {item.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
