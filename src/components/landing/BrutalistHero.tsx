"use client";

import { Button } from "@/components/ui/button";
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
        <section ref={containerRef} className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden bg-white text-slate-900">

            {/* Aurora Background Effects (Light Mode) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="aurora-blob absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-blue-200 rounded-full mix-blend-multiply filter blur-[80px] opacity-40 animate-pulse"></div>
                <div className="aurora-blob absolute top-[20%] right-[-10%] w-[50vw] h-[50vw] bg-purple-200 rounded-full mix-blend-multiply filter blur-[80px] opacity-40 animation-delay-2000"></div>
                <div className="aurora-blob absolute bottom-[-10%] left-[20%] w-[50vw] h-[50vw] bg-teal-200 rounded-full mix-blend-multiply filter blur-[80px] opacity-30 animation-delay-4000"></div>

                {/* Grid Overlay */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30"></div>
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            </div>

            <div className="container relative z-10 px-4 pt-20 text-left">

                {/* H1 */}
                <h1 className="hero-content max-w-5xl mr-auto text-5xl sm:text-7xl md:text-8xl font-black tracking-tight mb-8 leading-tight font-[family-name:var(--font-jp)] text-black">
                    <span>
                        {heroContent.title.en}
                    </span>
                    <span className="block text-2xl sm:text-3xl md:text-4xl font-bold text-black mt-6 tracking-wide">
                        {heroContent.title.ja}
                    </span>
                </h1>

                {/* Buttons */}
                <div className="hero-content flex flex-col sm:flex-row items-center justify-start gap-4 mb-24">
                    {isSignedIn ? (
                        <Button asChild size="lg" className="h-14 px-10 rounded-full bg-slate-900 text-white font-bold hover:bg-slate-800 hover:scale-105 transition-all shadow-lg shadow-slate-200/50">
                            <Link href="/dashboard">
                                Go To Dashboard <ArrowRight className="ml-2 w-5 h-5" />
                            </Link>
                        </Button>
                    ) : (
                        <>
                            <Button asChild size="lg" className="h-14 px-10 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-500 hover:shadow-[0_0_30px_-5px_rgba(37,99,235,0.4)] transition-all border-0 shadow-lg shadow-blue-200">
                                <Link href="/join">
                                    {heroContent.buttons.primary}
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="lg" className="h-14 px-10 rounded-full text-slate-600 hover:text-slate-900 hover:bg-white border border-slate-200 bg-white/50 backdrop-blur-sm transition-all shadow-sm">
                                <Link href="#features">
                                    {heroContent.buttons.secondary}
                                </Link>
                            </Button>
                        </>
                    )}
                </div>

                {/* Moving Gallery (Glassmorphism Light) */}
                <div className="hero-content w-full max-w-6xl mx-auto border border-white/40 bg-white/30 backdrop-blur-md rounded-2xl overflow-hidden py-10 shadow-xl shadow-blue-100/20 ring-1 ring-white/60">
                    <div className="animate-scroll inline-flex items-center gap-20 min-w-full">
                        {[...heroContent.gallery, ...heroContent.gallery, ...heroContent.gallery].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity cursor-default group grayscale hover:grayscale-0">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                ></div>
                                <span className="text-xl font-bold text-slate-600 group-hover:text-slate-900 tracking-wider">
                                    {item.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </section>
    );
}
