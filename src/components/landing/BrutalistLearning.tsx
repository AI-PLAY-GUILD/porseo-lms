"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Target, Trophy, Zap } from "lucide-react";
import Link from "next/link";

export function BrutalistLearning() {
    return (
        <section className="py-24 bg-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -z-10"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[100px] -z-10"></div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-16">

                    {/* Text Content */}
                    <div className="lg:w-1/2 text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 backdrop-blur-sm border border-border text-foreground text-sm font-bold tracking-wide uppercase mb-6">
                            <Zap className="w-4 h-4 text-primary" />
                            LMSプラットフォーム
                        </div>

                        <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-foreground tracking-tight mb-6 leading-tight">
                            あなた専用の <br />
                            <span className="text-gradient">ダッシュボード</span>
                        </h2>

                        <p className="text-lg sm:text-xl font-medium text-muted-foreground mb-8 leading-relaxed">
                            自分専用のダッシュボードで、学習の進捗を可視化。<br />
                            ランクアップシステムで、モチベーションを維持。
                        </p>

                        <div className="space-y-6 mb-10">
                            <div className="flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                                    <BarChart3 className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-foreground">学習分析</h3>
                                    <p className="text-sm text-muted-foreground">学習時間をグラフで管理</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/20 transition-colors">
                                    <Target className="w-6 h-6 text-accent" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-foreground">目標設定</h3>
                                    <p className="text-sm text-muted-foreground">目標を設定して達成率を確認</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500/20 transition-colors">
                                    <Trophy className="w-6 h-6 text-purple-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-foreground">ランクシステム</h3>
                                    <p className="text-sm text-muted-foreground">学習量に応じてランクアップ</p>
                                </div>
                            </div>
                        </div>

                        <Button asChild size="lg" variant="default" className="h-14 sm:h-16 px-10 text-lg sm:text-xl font-bold rounded-full shadow-lg shadow-primary/25 hover:shadow-primary/40">
                            <Link href="/join">
                                今すぐ参加 <ArrowRight className="ml-2 w-6 h-6" />
                            </Link>
                        </Button>
                    </div>

                    {/* Visual Content (Mockup) */}
                    <div className="lg:w-1/2 w-full relative">
                        {/* Decorative elements behind */}
                        <div className="absolute top-10 -right-10 w-64 h-64 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl -z-10"></div>
                        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl -z-10"></div>

                        {/* Dashboard Mockup Card */}
                        <div className="relative bg-white/80 backdrop-blur-md border border-white/20 rounded-3xl p-8 shadow-soft transform rotate-2 hover:rotate-0 transition-transform duration-500">
                            <div className="flex items-center justify-between mb-8 border-b border-border/50 pb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                </div>
                                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">マイダッシュボード</div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-white rounded-2xl p-5 shadow-sm border border-border/50">
                                    <div className="text-xs font-bold text-muted-foreground mb-2">総学習時間</div>
                                    <div className="text-3xl font-extrabold text-foreground">124<span className="text-sm text-muted-foreground ml-1">h</span></div>
                                </div>
                                <div className="bg-white rounded-2xl p-5 shadow-sm border border-border/50">
                                    <div className="text-xs font-bold text-muted-foreground mb-2">連続日数</div>
                                    <div className="text-3xl font-extrabold text-primary">12<span className="text-sm text-muted-foreground ml-1">days</span></div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-5 mb-6 shadow-sm border border-border/50">
                                <div className="flex justify-between items-end mb-4">
                                    <div className="text-sm font-bold text-foreground">週間アクティビティ</div>
                                </div>
                                <div className="flex items-end justify-between h-24 gap-2">
                                    {[40, 70, 45, 90, 60, 80, 50].map((h, i) => (
                                        <div key={i} className="w-full bg-gradient-to-t from-primary/80 to-accent/80 rounded-t-md opacity-80 hover:opacity-100 transition-opacity" style={{ height: `${h}%` }}></div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-4 bg-slate-900 text-white p-4 rounded-2xl shadow-lg">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-md">
                                    <Trophy className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <div className="text-xs text-slate-400 font-medium">現在のランク</div>
                                    <div className="text-sm font-bold text-white">AI MASTER</div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Bottom Gradient for Natural Transition */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-primary z-10 pointer-events-none"></div>
        </section>
    );
}
