"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Target, Trophy, Zap } from "lucide-react";
import Link from "next/link";

export function BrutalistLearning() {
    return (
        <section className="py-16 bg-white border-b-4 border-black relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '20px 20px' }}></div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-16">

                    {/* Text Content */}
                    <div className="lg:w-1/2 text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pop-green border-2 border-black text-black text-sm font-black tracking-widest uppercase mb-6 brutal-shadow-sm transform -rotate-2">
                            <Zap className="w-4 h-4" />
                            LMS Platform
                        </div>

                        <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-black uppercase tracking-tighter mb-6 leading-tight">
                            YOUR PERSONAL <br />
                            <span className="bg-black text-white px-2">DASHBOARD</span>
                        </h2>

                        <p className="text-lg sm:text-xl font-bold text-black mb-8 leading-relaxed">
                            自分専用のダッシュボードで、学習の進捗を可視化。<br />
                            ランクアップシステムで、モチベーションを維持。
                        </p>

                        <div className="space-y-6 mb-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-pop-yellow border-4 border-black flex items-center justify-center flex-shrink-0 brutal-shadow-sm">
                                    <BarChart3 className="w-6 h-6 text-black" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-black uppercase">Visual Analytics</h3>
                                    <p className="text-sm font-bold text-gray-600">学習時間をグラフで管理</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-pop-red border-4 border-black flex items-center justify-center flex-shrink-0 brutal-shadow-sm">
                                    <Target className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-black uppercase">Goal Setting</h3>
                                    <p className="text-sm font-bold text-gray-600">目標を設定して達成率を確認</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-pop-purple border-4 border-black flex items-center justify-center flex-shrink-0 brutal-shadow-sm">
                                    <Trophy className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-black uppercase">Rank System</h3>
                                    <p className="text-sm font-bold text-gray-600">学習量に応じてランクアップ</p>
                                </div>
                            </div>
                        </div>

                        <Button asChild size="lg" className="h-14 sm:h-16 px-8 text-lg sm:text-xl font-black rounded-xl bg-black text-white border-4 border-transparent hover:border-black hover:bg-white hover:text-black brutal-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                            <Link href="/join">
                                JOIN COMMUNITY <ArrowRight className="ml-2 w-6 h-6" />
                            </Link>
                        </Button>
                    </div>

                    {/* Visual Content (Mockup) */}
                    <div className="lg:w-1/2 w-full relative">
                        {/* Decorative elements behind */}
                        <div className="absolute top-10 -right-10 w-40 h-40 bg-pop-green rounded-full border-4 border-black brutal-shadow hidden md:block"></div>
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-pop-yellow rounded-none rotate-12 border-4 border-black brutal-shadow hidden md:block"></div>

                        {/* Dashboard Mockup Card */}
                        <div className="relative bg-cream border-4 border-black rounded-2xl p-6 brutal-shadow-lg transform rotate-2 hover:rotate-0 transition-transform duration-500">
                            <div className="flex items-center justify-between mb-6 border-b-2 border-black pb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500 border border-black"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500 border border-black"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500 border border-black"></div>
                                </div>
                                <div className="text-xs font-bold text-gray-500 uppercase">My Dashboard</div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-white border-2 border-black rounded-lg p-4 brutal-shadow-sm">
                                    <div className="text-xs font-bold text-gray-500 mb-1">TOTAL HOURS</div>
                                    <div className="text-3xl font-black text-black">124<span className="text-sm">h</span></div>
                                </div>
                                <div className="bg-white border-2 border-black rounded-lg p-4 brutal-shadow-sm">
                                    <div className="text-xs font-bold text-gray-500 mb-1">STREAK</div>
                                    <div className="text-3xl font-black text-pop-red">12<span className="text-sm text-black">days</span></div>
                                </div>
                            </div>

                            <div className="bg-white border-2 border-black rounded-lg p-4 mb-4 brutal-shadow-sm">
                                <div className="flex justify-between items-end mb-2">
                                    <div className="text-sm font-black">WEEKLY ACTIVITY</div>
                                </div>
                                <div className="flex items-end justify-between h-24 gap-2">
                                    {[40, 70, 45, 90, 60, 80, 50].map((h, i) => (
                                        <div key={i} className="w-full bg-pop-purple border border-black rounded-t-sm" style={{ height: `${h}%` }}></div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 bg-black text-white p-3 rounded-lg border-2 border-black">
                                <Trophy className="w-5 h-5 text-pop-yellow" />
                                <div className="text-sm font-bold">Current Rank: <span className="text-pop-yellow">AI MASTER</span></div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
