"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Rocket, Target, Code2, Terminal, Cpu } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ParticleBackground } from "./particle-background";

gsap.registerPlugin(ScrollTrigger);

export function BrutalistHackathon() {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLDivElement>(null);
    const visualRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: containerRef.current,
                start: "top 70%",
                end: "bottom bottom",
                toggleActions: "play none none reverse",
            }
        });

        tl.fromTo(visualRef.current,
            { scale: 0.9, opacity: 0 },
            { scale: 1, opacity: 1, duration: 1, ease: "power3.out" }
        );

        tl.fromTo(textRef.current,
            { x: 50, opacity: 0 },
            { x: 0, opacity: 1, duration: 1, ease: "power3.out" },
            "-=0.8"
        );

    }, { scope: containerRef });

    return (
        <section ref={containerRef} className="py-12 md:py-24 relative overflow-hidden bg-white">
            <div className="absolute inset-0 z-0 opacity-50 pointer-events-none">
                <ParticleBackground />
            </div>
            {/* Background Pattern */}
            <div className="absolute top-0 left-0 w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-yellow-50 rounded-full blur-[120px] -z-10"></div>
            <div className="absolute bottom-0 right-0 w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-orange-50 rounded-full blur-[120px] -z-10"></div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-10 md:gap-16">

                    {/* Visual Content (Abstract Design) - Left Side */}
                    <div ref={visualRef} className="lg:w-1/2 w-full relative">
                        {/* Decorative elements behind */}
                        <div className="absolute top-10 -left-10 w-64 h-64 bg-yellow-100 rounded-full blur-3xl hidden md:block -z-10"></div>

                        {/* Abstract Hackathon Visual */}
                        <div className="relative bg-white rounded-3xl p-6 md:p-10 shadow-xl border border-border/50 flex flex-col items-center justify-center text-center overflow-hidden min-h-[250px] md:min-h-[400px]">

                            {/* Animated Background Elements */}
                            <div className="absolute inset-0 opacity-10">
                                <div className="absolute top-10 left-10 w-20 h-20 border-4 border-yellow-500 rounded-full animate-pulse"></div>
                                <div className="absolute bottom-10 right-10 w-32 h-32 border-4 border-orange-500 rounded-full animate-pulse delay-700"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 md:w-64 md:h-64 border border-gray-200 rounded-full animate-spin-slow opacity-50"></div>
                            </div>

                            <div className="relative z-10 space-y-6">
                                <div className="flex justify-center gap-4">
                                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                                        <Code2 className="w-8 h-8 text-gray-600" />
                                    </div>
                                    <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center">
                                        <Terminal className="w-8 h-8 text-yellow-600" />
                                    </div>
                                    <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center">
                                        <Cpu className="w-8 h-8 text-orange-600" />
                                    </div>
                                </div>

                                <h3 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground">
                                    BUILD<br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-500">
                                        THE FUTURE
                                    </span>
                                </h3>

                                <div className="inline-block px-6 py-2 bg-black text-white rounded-full font-bold text-sm tracking-widest uppercase">
                                    48 Hours Challenge
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Text Content - Right Side */}
                    <div ref={textRef} className="lg:w-1/2 text-left">


                        <h2 className="text-3xl sm:text-5xl md:text-6xl font-thin text-foreground tracking-tighter mb-6 leading-tight">
                            自分の実力を <br />
                            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-500">
                                試せる環境
                            </span>
                        </h2>

                        <p className="text-lg sm:text-xl font-light text-muted-foreground mb-8 leading-relaxed">
                            定期的に開催されるハッカソンイベントに参加しよう。<br />
                            チームを組み、短期間で集中してプロダクトを作り上げる経験は、あなたのエンジニアとしての実力を飛躍的に高めます。
                        </p>

                        <div className="space-y-6 mb-10">
                            <div className="flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors border border-transparent">
                                    <Rocket className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-foreground mb-1">Real Experience</h3>
                                    <p className="text-sm text-muted-foreground">「動くもの」を作る過程でしか得られない、確かな知見</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/20 transition-colors border border-transparent">
                                    <Target className="w-6 h-6 text-accent" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-foreground mb-1">Social Impact</h3>
                                    <p className="text-sm text-muted-foreground">市場価値のある成果へと繋げていく出口戦略</p>
                                </div>
                            </div>
                        </div>

                        <Button asChild size="lg" className="h-14 sm:h-16 px-10 text-lg sm:text-xl group relative overflow-hidden rounded-full font-bold bg-white/10 backdrop-blur-md border border-white/20 text-[#135bec] tracking-wide uppercase transition-all duration-300 hover:bg-[#135bec]/10 hover:border-[#135bec]/50 hover:shadow-[0_0_30px_rgba(19,91,236,0.3)]">
                            <Link href="/join">
                                <span className="relative z-10 flex items-center">今すぐ参加 <ArrowRight className="ml-2 w-6 h-6" /></span>
                                <div className="absolute inset-0 bg-gradient-to-r from-[#135bec]/0 via-[#135bec]/10 to-[#135bec]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                            </Link>
                        </Button>
                    </div>

                </div>
            </div>

            {/* Bottom Gradient for Natural Transition */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-white z-10 pointer-events-none"></div>
        </section>
    );
}
