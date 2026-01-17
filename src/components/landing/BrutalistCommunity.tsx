"use client";

import { Button } from "@/components/ui/button";
import { MessageCircle, Users, Hash, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ParticleBackground } from "./particle-background";

gsap.registerPlugin(ScrollTrigger);

export function BrutalistCommunity() {
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
            { x: -50, opacity: 0 },
            { x: 0, opacity: 1, duration: 1, ease: "power3.out" }
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
            <div className="absolute top-0 right-0 w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-indigo-50 rounded-full blur-[120px] -z-10"></div>
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-blue-50 rounded-full blur-[120px] -z-10"></div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col-reverse lg:flex-row items-center gap-10 md:gap-16">

                    {/* Visual Content (Mockup) */}
                    <div ref={visualRef} className="lg:w-1/2 w-full relative">
                        {/* Decorative elements */}
                        <div className="absolute -top-6 -left-6 w-full h-full bg-indigo-100 rounded-3xl opacity-50 blur-2xl hidden md:block -z-10"></div>

                        {/* Discord Mockup Card - Light Mode Style */}
                        <div className="relative bg-white rounded-2xl overflow-hidden shadow-xl border border-border/50">
                            <div className="flex h-full min-h-[400px]">
                                {/* Sidebar */}
                                <div className="w-16 bg-gray-50 p-3 flex flex-col items-center gap-4 border-r border-border/50">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-md">
                                        <Sparkles className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center hover:bg-green-50 transition-colors cursor-pointer group">
                                        <div className="w-6 h-6 rounded-full border-2 border-gray-300 group-hover:border-green-400 transition-colors"></div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center hover:bg-yellow-50 transition-colors cursor-pointer group">
                                        <div className="w-6 h-6 rounded-full border-2 border-gray-300 group-hover:border-yellow-400 transition-colors"></div>
                                    </div>
                                </div>

                                {/* Channel List */}
                                <div className="w-48 bg-gray-50 p-4 hidden sm:block border-r border-border/50">
                                    <div className="font-bold text-sm mb-4 px-2 text-foreground">AI PLAY GUILD</div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 px-2 py-1 rounded bg-gray-200 text-foreground">
                                            <Hash className="w-4 h-4 text-gray-500" />
                                            <span className="text-sm font-medium">general</span>
                                        </div>
                                        <div className="flex items-center gap-2 px-2 py-1 rounded text-muted-foreground hover:bg-gray-200 hover:text-foreground cursor-pointer transition-colors">
                                            <Hash className="w-4 h-4" />
                                            <span className="text-sm font-medium">announcements</span>
                                        </div>
                                        <div className="flex items-center gap-2 px-2 py-1 rounded text-muted-foreground hover:bg-gray-200 hover:text-foreground cursor-pointer transition-colors">
                                            <Hash className="w-4 h-4" />
                                            <span className="text-sm font-medium">showcase</span>
                                        </div>
                                        <div className="flex items-center gap-2 px-2 py-1 rounded text-muted-foreground hover:bg-gray-200 hover:text-foreground cursor-pointer transition-colors">
                                            <Hash className="w-4 h-4" />
                                            <span className="text-sm font-medium">help-wanted</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Chat Area */}
                                <div className="flex-1 p-4 bg-white flex flex-col justify-end">
                                    <div className="space-y-6">
                                        <div className="flex gap-3 group">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-orange-400 flex-shrink-0 shadow-sm"></div>
                                            <div>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="font-bold text-sm text-foreground group-hover:underline cursor-pointer">Player_A</span>
                                                    <span className="text-[10px] text-muted-foreground">Today at 10:30 AM</span>
                                                </div>
                                                <p className="text-sm text-foreground/80 mt-1 leading-relaxed">
                                                    APIエラーで詰まってしまいました...ログ共有します！誰か分かりますか？😭
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 group">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-400 flex-shrink-0 shadow-sm"></div>
                                            <div>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="font-bold text-sm text-foreground group-hover:underline cursor-pointer">Player_B</span>
                                                    <span className="text-[10px] text-muted-foreground">Today at 10:32 AM</span>
                                                </div>
                                                <p className="text-sm text-foreground/80 mt-1 leading-relaxed">
                                                    そのエラー、私も経験あります！コードの3行目の型定義を変えてみてください👍
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 bg-gray-100 rounded-lg p-3 flex items-center gap-3 border border-border/50">
                                        <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-400 transition-colors text-white">
                                            <span className="text-xs font-bold">+</span>
                                        </div>
                                        <div className="h-2 w-32 bg-gray-300 rounded-full opacity-50"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Text Content */}
                    <div ref={textRef} className="lg:w-1/2 text-left">


                        <h2 className="text-3xl sm:text-5xl md:text-6xl font-thin text-foreground tracking-tighter mb-6 leading-tight">
                            仲間に <br />
                            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">
                                相談する
                            </span>
                        </h2>

                        <p className="text-lg sm:text-xl font-light text-muted-foreground mb-8 leading-relaxed">
                            一人で悩む時間は終わり。<br />
                            同じ志を持つ仲間と、知識を共有し、共に成長しよう！
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                            <div className="bg-white p-6 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all">
                                <Users className="w-8 h-8 mb-3 text-primary" />
                                <h3 className="font-bold text-foreground mb-1">Networking</h3>
                                <p className="text-sm text-muted-foreground">AIを楽しむメンバーと繋がる</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all">
                                <Hash className="w-8 h-8 mb-3 text-accent" />
                                <h3 className="font-bold text-foreground mb-1">Exclusive Info</h3>
                                <p className="text-sm text-muted-foreground">ここだけの最新AI情報をゲット</p>
                            </div>
                        </div>

                        <Button asChild size="lg" variant="default" className="h-14 sm:h-16 px-10 text-lg sm:text-xl group relative overflow-hidden rounded-full font-bold bg-white/10 backdrop-blur-md border border-white/20 text-[#135bec] tracking-wide uppercase transition-all duration-300 hover:bg-[#135bec]/10 hover:border-[#135bec]/50 hover:shadow-[0_0_30px_rgba(19,91,236,0.3)]">
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
