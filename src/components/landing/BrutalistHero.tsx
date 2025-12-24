"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

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
            y: 100,
            opacity: 0,
            duration: 1,
            ease: "elastic.out(1, 0.5)",
            delay: 0.2
        });
    }, { scope: containerRef });

    return (
        <section ref={containerRef} className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 pt-20 text-center z-10 bg-cream overflow-hidden border-b-4 border-black">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>

            {/* Floating Shapes */}
            <div className="absolute top-20 left-10 w-24 h-24 bg-pop-yellow rounded-full border-4 border-black brutal-shadow animate-blob animation-delay-2000 hidden md:block"></div>
            <div className="absolute bottom-40 right-10 w-32 h-32 bg-pop-purple rounded-none rotate-12 border-4 border-black brutal-shadow animate-blob hidden md:block"></div>
            <div className="absolute top-40 right-20 w-16 h-16 bg-pop-red rounded-full border-4 border-black brutal-shadow animate-blob animation-delay-4000 hidden md:block"></div>

            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white border-2 border-black brutal-shadow-sm text-black font-bold mb-8 transform -rotate-2 hover:rotate-0 transition-transform cursor-default">
                <Sparkles className="w-5 h-5 text-pop-yellow fill-pop-yellow" />
                <span className="font-heading tracking-wide">Next Gen AI Community</span>
            </div>

            <h1 ref={titleRef} className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tight mb-8 text-black leading-[0.9]">
                MASTER <span className="text-pop-red text-stroke-2 text-transparent">AI</span>,
                <br />
                SHAPE THE <span className="bg-pop-yellow px-2 border-4 border-black transform inline-block -rotate-2">FUTURE</span>
            </h1>

            <p className="text-xl md:text-2xl text-black font-bold max-w-2xl mb-12 leading-relaxed bg-white/50 backdrop-blur-sm p-4 rounded-xl border-2 border-black brutal-shadow-sm transform rotate-1">
                AI Play Guildは、最先端のAI技術を遊び倒す<br className="hidden md:block" />
                プレミアムコミュニティです。
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-6">
                {isSignedIn ? (
                    <Button asChild size="lg" className="h-16 px-10 text-xl font-black rounded-xl bg-pop-green text-black border-4 border-black brutal-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                        <Link href="/dashboard">
                            GO TO DASHBOARD <ArrowRight className="ml-2 w-6 h-6" />
                        </Link>
                    </Button>
                ) : (
                    <>
                        <Button asChild size="lg" className="h-16 px-10 text-xl font-black rounded-xl bg-pop-red text-white border-4 border-black brutal-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                            <Link href="/join">
                                JOIN COMMUNITY
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="h-16 px-10 text-xl font-black rounded-xl bg-white text-black border-4 border-black brutal-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                            <Link href="#features">
                                LEARN MORE
                            </Link>
                        </Button>
                    </>
                )}
            </div>

            {/* Marquee */}
            <div className="absolute bottom-0 left-0 w-full bg-pop-yellow border-t-4 border-black py-3 overflow-hidden whitespace-nowrap">
                <div className="animate-scroll inline-block">
                    <span className="text-2xl font-black mx-8">🚀 LATEST AI MODELS</span>
                    <span className="text-2xl font-black mx-8">⚡ PROMPT ENGINEERING</span>
                    <span className="text-2xl font-black mx-8">🤝 ACTIVE COMMUNITY</span>
                    <span className="text-2xl font-black mx-8">🛠 HANDS-ON PROJECTS</span>
                    <span className="text-2xl font-black mx-8">🚀 LATEST AI MODELS</span>
                    <span className="text-2xl font-black mx-8">⚡ PROMPT ENGINEERING</span>
                    <span className="text-2xl font-black mx-8">🤝 ACTIVE COMMUNITY</span>
                    <span className="text-2xl font-black mx-8">🛠 HANDS-ON PROJECTS</span>
                </div>
            </div>
        </section>
    );
}
