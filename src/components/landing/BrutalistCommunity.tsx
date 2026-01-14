"use client";

import { Button } from "@/components/ui/button";
import { MessageCircle, Users, Hash, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export function BrutalistCommunity() {
    return (
        <section className="py-24 bg-gradient-to-br from-slate-900 to-slate-800 relative overflow-hidden text-white">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] -z-10"></div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col-reverse lg:flex-row items-center gap-16">

                    {/* Visual Content (Mockup) */}
                    <div className="lg:w-1/2 w-full relative">
                        {/* Decorative elements */}
                        <div className="absolute -top-6 -left-6 w-full h-full bg-gradient-to-br from-primary to-accent rounded-3xl opacity-20 blur-2xl hidden md:block"></div>

                        {/* Discord Mockup Card */}
                        <div className="relative bg-[#36393f] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                            <div className="flex h-full min-h-[400px]">
                                {/* Sidebar */}
                                <div className="w-16 bg-[#202225] p-3 flex flex-col items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
                                        <Sparkles className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-[#36393f] flex items-center justify-center hover:bg-green-500 transition-colors cursor-pointer group">
                                        <div className="w-6 h-6 rounded-full border-2 border-gray-500 group-hover:border-white transition-colors"></div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-[#36393f] flex items-center justify-center hover:bg-yellow-500 transition-colors cursor-pointer group">
                                        <div className="w-6 h-6 rounded-full border-2 border-gray-500 group-hover:border-white transition-colors"></div>
                                    </div>
                                </div>

                                {/* Channel List */}
                                <div className="w-48 bg-[#2f3136] p-4 hidden sm:block">
                                    <div className="font-bold text-sm mb-4 px-2 text-white">AI PLAY GUILD</div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 px-2 py-1 rounded bg-[#393c43] text-white">
                                            <Hash className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm font-medium">general</span>
                                        </div>
                                        <div className="flex items-center gap-2 px-2 py-1 rounded text-gray-400 hover:bg-[#393c43] hover:text-white cursor-pointer transition-colors">
                                            <Hash className="w-4 h-4" />
                                            <span className="text-sm font-medium">announcements</span>
                                        </div>
                                        <div className="flex items-center gap-2 px-2 py-1 rounded text-gray-400 hover:bg-[#393c43] hover:text-white cursor-pointer transition-colors">
                                            <Hash className="w-4 h-4" />
                                            <span className="text-sm font-medium">showcase</span>
                                        </div>
                                        <div className="flex items-center gap-2 px-2 py-1 rounded text-gray-400 hover:bg-[#393c43] hover:text-white cursor-pointer transition-colors">
                                            <Hash className="w-4 h-4" />
                                            <span className="text-sm font-medium">help-wanted</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Chat Area */}
                                <div className="flex-1 p-4 bg-[#36393f] flex flex-col justify-end">
                                    <div className="space-y-6">
                                        <div className="flex gap-3 group">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex-shrink-0 shadow-md"></div>
                                            <div>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="font-bold text-sm text-red-400 group-hover:underline cursor-pointer">Player_A</span>
                                                    <span className="text-[10px] text-gray-400">Today at 10:30 AM</span>
                                                </div>
                                                <p className="text-sm text-gray-300 mt-1 leading-relaxed">
                                                    APIエラーで詰まってしまいました...ログ共有します！誰か分かりますか？😭
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 group">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex-shrink-0 shadow-md"></div>
                                            <div>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="font-bold text-sm text-green-400 group-hover:underline cursor-pointer">Player_B</span>
                                                    <span className="text-[10px] text-gray-400">Today at 10:32 AM</span>
                                                </div>
                                                <p className="text-sm text-gray-300 mt-1 leading-relaxed">
                                                    そのエラー、私も経験あります！コードの3行目の型定義を変えてみてください👍
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 bg-[#40444b] rounded-lg p-3 flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center cursor-pointer hover:text-white transition-colors">
                                            <span className="text-xs font-bold">+</span>
                                        </div>
                                        <div className="h-2 w-32 bg-gray-600 rounded-full opacity-50"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Text Content */}
                    <div className="lg:w-1/2 text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-bold tracking-wide uppercase mb-6">
                            <MessageCircle className="w-4 h-4 text-accent" />
                            Community
                        </div>

                        <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-6 leading-tight">
                            Join The <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Discord</span>
                        </h2>

                        <p className="text-lg sm:text-xl font-medium text-gray-300 mb-8 leading-relaxed">
                            一人で悩む時間は終わり。<br />
                            同じ志を持つ仲間と、知識を共有し、共に成長しよう！
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                            <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                                <Users className="w-8 h-8 mb-3 text-primary" />
                                <h3 className="font-bold text-white mb-1">Networking</h3>
                                <p className="text-sm text-gray-400">AIを楽しむメンバーと繋がる</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                                <Hash className="w-8 h-8 mb-3 text-accent" />
                                <h3 className="font-bold text-white mb-1">Exclusive Info</h3>
                                <p className="text-sm text-gray-400">ここだけの最新AI情報をゲット</p>
                            </div>
                        </div>

                        <Button asChild size="lg" variant="gradient" className="h-14 sm:h-16 px-10 text-lg sm:text-xl font-bold rounded-full shadow-lg shadow-primary/25 hover:shadow-primary/40">
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
