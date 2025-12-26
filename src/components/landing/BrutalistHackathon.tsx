"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Trophy, Rocket, Target, Star, Medal, Crown } from "lucide-react";
import Link from "next/link";

export function BrutalistHackathon() {
    return (
        <section className="py-16 bg-pop-red border-b-4 border-black relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '20px 20px' }}></div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-16">

                    {/* Visual Content (Mockup) - Left Side */}
                    <div className="lg:w-1/2 w-full relative">
                        {/* Decorative elements behind */}
                        <div className="absolute top-10 -left-10 w-40 h-40 bg-pop-yellow rounded-full border-4 border-black brutal-shadow hidden md:block"></div>
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-pop-purple rounded-none -rotate-12 border-4 border-black brutal-shadow hidden md:block"></div>

                        {/* Hackathon Cup Card */}
                        <div className="relative bg-white border-4 border-black rounded-2xl p-8 brutal-shadow-lg flex flex-col items-center text-center overflow-hidden">

                            <div className="mb-6 relative mt-4">
                                {/* Trophy Icon */}
                                <div className="relative z-10 flex justify-center items-center w-48 h-48 bg-pop-yellow rounded-full border-4 border-black">
                                    <Trophy className="w-24 h-24 text-black" strokeWidth={2} />
                                </div>
                                {/* Static decorations */}
                                <Star className="absolute top-0 -left-4 w-10 h-10 text-pop-red fill-current" />
                                <Star className="absolute bottom-4 -right-4 w-8 h-8 text-pop-purple fill-current" />
                            </div>

                            <h3 className="text-5xl font-black uppercase mb-2 italic tracking-tighter text-black text-shadow-sm">
                                HACKATHON
                            </h3>

                            <div className="flex items-center gap-2 mb-6">
                                <Medal className="w-6 h-6 text-black" />
                                <span className="text-xl font-bold bg-black text-white px-4 py-1 rounded-sm transform -rotate-1">
                                    WIN THE GLORY
                                </span>
                                <Medal className="w-6 h-6 text-black" />
                            </div>

                            <div className="w-full bg-gray-100 border-2 border-black rounded-xl p-4 mb-4">
                                <div className="flex justify-between items-center mb-2 border-b-2 border-gray-300 pb-2">
                                    <span className="font-bold text-sm text-gray-500">NEXT EVENT</span>
                                    <span className="font-black text-pop-red">COMING SOON</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-sm text-gray-500">PRIZE</span>
                                    <span className="font-black text-xl">???</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Text Content - Right Side */}
                    <div className="lg:w-1/2 text-left text-white">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black border-2 border-white text-white text-sm font-black tracking-widest uppercase mb-6 brutal-shadow-sm transform -rotate-2">
                            <Trophy className="w-4 h-4 text-pop-yellow" />
                            Challenge Yourself
                        </div>

                        <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-white uppercase tracking-tighter mb-6 leading-tight text-shadow-black">
                            Guild <br />
                            <span className="bg-white text-black px-2 border-4 border-black">Hackathon</span>
                        </h2>

                        <p className="text-lg sm:text-xl font-bold text-white mb-8 leading-relaxed drop-shadow-md">
                            インプットだけの毎日にさよなら。<br />
                            自分の成長を確かめ、社会実装への第一歩を踏み出す場所です。
                        </p>

                        <div className="space-y-6 mb-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-pop-yellow border-4 border-black flex items-center justify-center flex-shrink-0 brutal-shadow-sm">
                                    <Rocket className="w-6 h-6 text-black" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white uppercase text-shadow-sm">Real Experience</h3>
                                    <p className="text-sm font-bold text-gray-100">「動くもの」を作る過程でしか得られない、確かな知見</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-pop-purple border-4 border-black flex items-center justify-center flex-shrink-0 brutal-shadow-sm">
                                    <Target className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white uppercase text-shadow-sm">Social Impact</h3>
                                    <p className="text-sm font-bold text-gray-100">市場価値のある成果へと繋げていく出口戦略</p>
                                </div>
                            </div>
                        </div>

                        <Button asChild size="lg" className="h-14 sm:h-16 px-8 text-lg sm:text-xl font-black rounded-xl bg-white text-black border-4 border-black hover:bg-black hover:text-white brutal-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                            <Link href="/join">
                                JOIN COMMUNITY <ArrowRight className="ml-2 w-6 h-6" />
                            </Link>
                        </Button>
                    </div>

                </div>
            </div>
        </section>
    );
}
