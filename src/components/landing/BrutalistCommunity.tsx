"use client";

import { Button } from "@/components/ui/button";
import { MessageCircle, Users, Hash, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export function BrutalistCommunity() {
    return (
        <section className="py-16 bg-pop-purple border-b-4 border-black relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)', backgroundSize: '40px 40px', backgroundPosition: '0 0, 20px 20px' }}></div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col-reverse lg:flex-row items-center gap-16">

                    {/* Visual Content (Mockup) */}
                    <div className="lg:w-1/2 w-full relative">
                        {/* Decorative elements */}
                        <div className="absolute -top-6 -left-6 w-full h-full bg-black rounded-2xl border-4 border-white hidden md:block"></div>

                        {/* Discord Mockup Card */}
                        <div className="relative bg-[#36393f] border-4 border-black rounded-2xl overflow-hidden brutal-shadow-lg text-white">
                            <div className="flex h-full">
                                {/* Sidebar */}
                                <div className="w-16 bg-[#202225] p-3 flex flex-col items-center gap-4 border-r-2 border-black">
                                    <div className="w-10 h-10 rounded-full bg-pop-purple border-2 border-white flex items-center justify-center">
                                        <Sparkles className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-[#36393f] flex items-center justify-center hover:bg-pop-green transition-colors cursor-pointer">
                                        <div className="w-6 h-6 rounded-full border-2 border-gray-500"></div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-[#36393f] flex items-center justify-center hover:bg-pop-yellow transition-colors cursor-pointer">
                                        <div className="w-6 h-6 rounded-full border-2 border-gray-500"></div>
                                    </div>
                                </div>

                                {/* Channel List */}
                                <div className="w-48 bg-[#2f3136] p-4 hidden sm:block border-r-2 border-black">
                                    <div className="font-black text-sm mb-4 px-2">AI PLAY GUILD</div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 px-2 py-1 rounded bg-[#393c43] text-white">
                                            <Hash className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm font-bold">general</span>
                                        </div>
                                        <div className="flex items-center gap-2 px-2 py-1 rounded text-gray-400 hover:bg-[#393c43] hover:text-white cursor-pointer">
                                            <Hash className="w-4 h-4" />
                                            <span className="text-sm font-bold">announcements</span>
                                        </div>
                                        <div className="flex items-center gap-2 px-2 py-1 rounded text-gray-400 hover:bg-[#393c43] hover:text-white cursor-pointer">
                                            <Hash className="w-4 h-4" />
                                            <span className="text-sm font-bold">showcase</span>
                                        </div>
                                        <div className="flex items-center gap-2 px-2 py-1 rounded text-gray-400 hover:bg-[#393c43] hover:text-white cursor-pointer">
                                            <Hash className="w-4 h-4" />
                                            <span className="text-sm font-bold">help-wanted</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Chat Area */}
                                <div className="flex-1 p-4 bg-[#36393f] flex flex-col justify-end min-h-[300px]">
                                    <div className="space-y-4">
                                        <div className="flex gap-3">
                                            <div className="w-8 h-8 rounded-full bg-pop-red border border-black flex-shrink-0"></div>
                                            <div>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="font-black text-sm text-pop-red">Player_A</span>
                                                    <span className="text-[10px] text-gray-400">Today at 10:30 AM</span>
                                                </div>
                                                <p className="text-xs text-gray-300 mt-1">
                                                    APIエラーで詰まってしまいました...ログ共有します！誰か分かりますか？😭
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="w-8 h-8 rounded-full bg-pop-green border border-black flex-shrink-0"></div>
                                            <div>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="font-black text-sm text-pop-green">Player_B</span>
                                                    <span className="text-[10px] text-gray-400">Today at 10:32 AM</span>
                                                </div>
                                                <p className="text-xs text-gray-300 mt-1">
                                                    そのエラー、私も経験あります！コードの3行目の型定義を変えてみてください👍
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 bg-[#40444b] rounded-lg p-2 flex items-center gap-2 border border-black">
                                        <div className="w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center">
                                            <span className="text-xs text-white">+</span>
                                        </div>
                                        <div className="h-2 w-24 bg-gray-600 rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Text Content */}
                    <div className="lg:w-1/2 text-left text-white">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border-2 border-black text-black text-sm font-black tracking-widest uppercase mb-6 brutal-shadow-sm transform rotate-1">
                            <MessageCircle className="w-4 h-4" />
                            Community
                        </div>

                        <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-white uppercase tracking-tighter mb-6 leading-tight text-shadow-black">
                            Join The <br />
                            <span className="text-pop-yellow text-stroke-2">Discord</span>
                        </h2>

                        <p className="text-lg sm:text-xl font-bold text-white mb-8 leading-relaxed drop-shadow-md">
                            一人で悩む時間は終わり。<br />
                            同じ志を持つ仲間と、知識を共有し、共に成長しよう！
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                            <div className="bg-white text-black p-4 rounded-xl border-4 border-black brutal-shadow-sm">
                                <Users className="w-8 h-8 mb-2 text-pop-purple" />
                                <h3 className="font-black uppercase">Networking</h3>
                                <p className="text-xs font-bold text-gray-600">AIを楽しむメンバーと繋がる</p>
                            </div>
                            <div className="bg-white text-black p-4 rounded-xl border-4 border-black brutal-shadow-sm">
                                <Hash className="w-8 h-8 mb-2 text-pop-green" />
                                <h3 className="font-black uppercase">Exclusive Info</h3>
                                <p className="text-xs font-bold text-gray-600">ここだけの最新AI情報をゲット</p>
                            </div>
                        </div>

                        <Button asChild size="lg" className="h-14 sm:h-16 px-8 text-lg sm:text-xl font-black rounded-xl bg-white text-black border-4 border-black hover:bg-pop-yellow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all brutal-shadow">
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
