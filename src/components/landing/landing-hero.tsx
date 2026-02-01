"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface LandingHeroProps {
    isSignedIn: boolean;
    handleCheckout: () => void;
    checkoutLoading: boolean;
}

export function LandingHero({ isSignedIn, handleCheckout, checkoutLoading }: LandingHeroProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const textRef = useRef<HTMLParagraphElement>(null);
    const buttonsRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        tl.fromTo(titleRef.current,
            { y: 50, opacity: 0 },
            { y: 0, opacity: 1, duration: 1, delay: 0.2 }
        )
            .fromTo(textRef.current,
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8 },
                "-=0.6"
            )
            .fromTo(buttonsRef.current,
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8 },
                "-=0.6"
            );
    }, { scope: containerRef });

    return (
        <section ref={containerRef} className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-20 text-center z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] -z-10 pointer-events-none mix-blend-screen" />
            <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-violet-500/20 rounded-full blur-[80px] -z-10 pointer-events-none mix-blend-screen" />
            <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-fuchsia-500/20 rounded-full blur-[90px] -z-10 pointer-events-none mix-blend-screen" />

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-blue-300 mb-8 backdrop-blur-sm">
                <Sparkles className="w-4 h-4" />
                <span>Next Gen AI Community</span>
            </div>

            <h1 ref={titleRef} className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-6 opacity-0">
                <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-gray-500">
                    Master AI,
                </span>
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400">
                    Shape the Future
                </span>
            </h1>

            <p ref={textRef} className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed opacity-0">
                AI Play Guildは、最先端のAI技術を学び、実践し、仲間と共に成長するためのプレミアムコミュニティです。
                限定コンテンツ、ハンズオンワークショップ、そして熱狂的な仲間があなたを待っています。
            </p>

            <div ref={buttonsRef} className="flex flex-col sm:flex-row items-center gap-4 opacity-0">
                {isSignedIn ? (
                    <Button asChild size="lg" className="h-14 px-8 text-lg rounded-full bg-white text-black hover:bg-gray-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                        <Link href="/dashboard">
                            Go to Dashboard <ArrowRight className="ml-2 w-5 h-5" />
                        </Link>
                    </Button>
                ) : (
                    <>
                        <Button asChild size="lg" className="h-14 px-8 text-lg rounded-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white transition-all shadow-[0_0_30px_rgba(79,70,229,0.4)]">
                            <Link href="/join">
                                Join Community
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full border-white/20 bg-transparent hover:bg-white/10 text-white transition-all">
                            <Link href="#features">
                                Learn More
                            </Link>
                        </Button>
                    </>
                )}
            </div>
        </section>
    );
}
