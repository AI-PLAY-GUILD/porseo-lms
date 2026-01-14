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
            y: 50,
            opacity: 0,
            duration: 1.2,
            ease: "power3.out",
            delay: 0.2
        });
    }, { scope: containerRef });

    return (
        <section ref={containerRef} className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 pt-32 pb-32 text-center z-10 overflow-hidden bg-background">
            {/* Background Elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/20 rounded-full blur-[120px] -z-10 animate-pulse-glow"></div>
            <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-accent/10 rounded-full blur-[100px] -z-10"></div>

            {/* Floating Shapes */}
            <div className="absolute top-20 left-10 w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-full blur-xl opacity-60 animate-float hidden md:block"></div>
            <div className="absolute bottom-40 right-10 w-32 h-32 bg-gradient-to-tr from-accent to-primary rounded-full blur-xl opacity-60 animate-float hidden md:block" style={{ animationDelay: '2s' }}></div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 backdrop-blur-md border border-white/20 shadow-sm text-primary font-bold mb-8 animate-float">
                <Sparkles className="w-4 h-4 text-accent fill-accent" />
                <span className="text-sm tracking-wide uppercase">For The Players</span>
            </div>

            <h1 ref={titleRef} className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-extrabold tracking-tight mb-8 text-foreground leading-[1.1]">
                PLAY WITH <span className="text-gradient">AI</span>,
                <br />
                SHAPE THE <span className="text-gradient-reverse">FUTURE</span>
            </h1>

            <p className="text-lg md:text-2xl text-muted-foreground font-medium max-w-2xl mb-12 leading-relaxed">
                AI PLAY GUILDはAIで遊びながらその楽しさに熱狂し、<br />
                まだ見ぬ未来を創り出すコミュニティです。
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto px-4 sm:px-0">
                {isSignedIn ? (
                    <Button asChild size="lg" variant="gradient" className="h-14 sm:h-16 w-full sm:w-auto px-8 sm:px-12 text-lg sm:text-xl font-bold rounded-full">
                        <Link href="/dashboard">
                            GO TO DASHBOARD <ArrowRight className="ml-2 w-5 sm:w-6 h-5 sm:h-6" />
                        </Link>
                    </Button>
                ) : (
                    <>
                        <Button asChild size="lg" variant="gradient" className="h-14 sm:h-16 w-full sm:w-auto px-8 sm:px-12 text-lg sm:text-xl font-bold rounded-full">
                            <Link href="/join">
                                今すぐ参加
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="h-14 sm:h-16 w-full sm:w-auto px-8 sm:px-12 text-lg sm:text-xl font-bold rounded-full border-2 hover:bg-secondary/50">
                            <Link href="#features">
                                もっと詳しく
                            </Link>
                        </Button>
                    </>
                )}
            </div>

            {/* Marquee - Modernized */}
            <div className="absolute bottom-0 left-0 w-full bg-white/5 backdrop-blur-sm border-t border-white/10 py-4 overflow-hidden whitespace-nowrap">
                <div className="animate-scroll inline-block">
                    <span className="text-xl font-bold mx-12 text-muted-foreground/50">🚀 LATEST AI NEWS</span>
                    <span className="text-xl font-bold mx-12 text-muted-foreground/50">💻 LEARNING DASHBOARD</span>
                    <span className="text-xl font-bold mx-12 text-muted-foreground/50">🤝 ACTIVE COMMUNITY</span>
                    <span className="text-xl font-bold mx-12 text-muted-foreground/50">🛠 HANDS-ON</span>
                    <span className="text-xl font-bold mx-12 text-muted-foreground/50">🚀 LATEST AI NEWS</span>
                    <span className="text-xl font-bold mx-12 text-muted-foreground/50">💻 LEARNING DASHBOARD</span>
                    <span className="text-xl font-bold mx-12 text-muted-foreground/50">🤝 ACTIVE COMMUNITY</span>
                    <span className="text-xl font-bold mx-12 text-muted-foreground/50">🛠 HANDS-ON</span>
                </div>
            </div>
        </section>
    );
}
