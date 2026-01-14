"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Trophy, Rocket, Target, Star, Medal, Crown } from "lucide-react";
import Link from "next/link";

export function BrutalistHackathon() {
    return (
        <section className="py-24 bg-gradient-to-br from-primary to-blue-600 relative overflow-hidden text-white">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
            <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-white/10 rounded-full blur-[120px] -z-10"></div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-16">

                    {/* Visual Content (Mockup) - Left Side */}
                    <div className="lg:w-1/2 w-full relative">
                        {/* Decorative elements behind */}
                        <div className="absolute top-10 -left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl hidden md:block"></div>

                        {/* Hackathon Cup Card */}
                        <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-10 shadow-2xl flex flex-col items-center text-center overflow-hidden">

                            <div className="mb-8 relative mt-4">
                                {/* Trophy Icon */}
                                <div className="relative z-10 flex justify-center items-center w-48 h-48 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full shadow-lg shadow-yellow-500/30">
                                    <Trophy className="w-24 h-24 text-white drop-shadow-md" strokeWidth={2} />
                                </div>
                                {/* Static decorations */}
                                <Star className="absolute top-0 -left-4 w-10 h-10 text-yellow-200 fill-current animate-pulse" />
                                <Star className="absolute bottom-4 -right-4 w-8 h-8 text-yellow-200 fill-current animate-pulse delay-700" />
                            </div>

                            <h3 className="text-5xl font-extrabold uppercase mb-4 italic tracking-tight text-white drop-shadow-lg">
                                HACKATHON
                            </h3>

                            <div className="flex items-center gap-3 mb-8">
                                <Medal className="w-6 h-6 text-yellow-300" />
                                <span className="text-xl font-bold bg-white/20 backdrop-blur-sm text-white px-6 py-2 rounded-full border border-white/30">
                                    WIN THE GLORY
                                </span>
                                <Medal className="w-6 h-6 text-yellow-300" />
                            </div>

                            <div className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 mb-4">
                                <div className="flex justify-between items-center mb-3 border-b border-white/10 pb-3">
                                    <span className="font-bold text-sm text-blue-100">NEXT EVENT</span>
                                    <span className="font-extrabold text-yellow-300 tracking-wide">COMING SOON</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-sm text-blue-100">PRIZE</span>
                                    <span className="font-extrabold text-2xl text-white">???</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Text Content - Right Side */}
                    <div className="lg:w-1/2 text-left text-white">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-bold tracking-wide uppercase mb-6">
                            <Trophy className="w-4 h-4 text-yellow-300" />
                            Challenge Yourself
                        </div>

                        <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-6 leading-tight">
                            Guild <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500">Hackathon</span>
                        </h2>

                        <p className="text-lg sm:text-xl font-medium text-blue-50 mb-8 leading-relaxed">
                            インプットだけの毎日にさよなら。<br />
                            自分の成長を確かめ、社会実装への第一歩を踏み出す場所です。
                        </p>

                        <div className="space-y-6 mb-10">
                            <div className="flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 transition-colors border border-white/10">
                                    <Rocket className="w-6 h-6 text-yellow-300" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-1">Real Experience</h3>
                                    <p className="text-sm text-blue-100">「動くもの」を作る過程でしか得られない、確かな知見</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 transition-colors border border-white/10">
                                    <Target className="w-6 h-6 text-yellow-300" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-1">Social Impact</h3>
                                    <p className="text-sm text-blue-100">市場価値のある成果へと繋げていく出口戦略</p>
                                </div>
                            </div>
                        </div>

                        <Button asChild size="lg" className="h-14 sm:h-16 px-10 text-lg sm:text-xl font-bold rounded-full bg-white text-primary hover:bg-blue-50 hover:text-primary shadow-lg shadow-black/20 transition-all border-none">
                            <Link href="/join">
                                今すぐ参加 <ArrowRight className="ml-2 w-6 h-6" />
                            </Link>
                        </Button>
                    </div>

                </div>
            </div>
        </section>
    );
}
