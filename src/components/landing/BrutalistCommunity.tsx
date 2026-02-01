"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { WaveButton } from "@/components/ui/wave-button";
import Image from "next/image";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageCircleQuestion, TrendingUp, Home, Library, Coffee, Hash } from "lucide-react";

export function BrutalistCommunity() {
    const channels = [
        {
            name: "初心者質問部屋",
            tag: "質問のハードルゼロ",
            desc: "「こんなこと聞いていいのかな？」と迷う必要はありません。環境構築でのつまずきや初歩的なエラーこそ、このコミュニティが歓迎する「挑戦の証」です。初心者同士で助け合ったり、経験者からのアドバイスをもらったりしながら、安心して解決に向かえる相談窓口です。",
            icon: MessageCircleQuestion,
            color: "bg-green-400"
        },
        {
            name: "Xを伸ばそう！",
            tag: "運営陣が直接サポート",
            desc: "作ったプロダクトを社会に届けるための「発信力」を鍛える部屋です。X（旧Twitter）で影響力を持つ太陽や傑などの運営メンバーも参加し、ポストの添削やインプレッションを伸ばすためのノウハウを共有。開発だけでなく、マーケティング視点も養える実践的な場です。",
            icon: TrendingUp,
            color: "bg-blue-400"
        },
        {
            name: "個人チャンネル制度",
            tag: "自分だけの作業基地",
            desc: "希望者はコミュニティ内に「自分専用のチャンネル」を持つことができます（申請制）。日々の学習ログ（日報）、開発中の独り言、アイデアのメモなど、使い方は自由。他のメンバーがあなたの部屋に遊びに来てコメントをくれることもあり、個人の活動をコミュニティ全体で見守る仕組みです。",
            icon: Home,
            color: "bg-purple-400"
        },
        {
            name: "ツールライブラリ",
            tag: "ツール別・技術の集合知",
            desc: "Cursor、Claude Code、Dify、n8nなど、主要なAIツールごとに細分化されたチャンネル群です。特定のツールに関する最新情報、便利な使い方、マニアックな検証結果がここに集約されます。「このツールについて知りたい」と思ったら、まずはここを覗けばヒントが見つかります。",
            icon: Library,
            color: "bg-orange-400",
            isLibrary: true
        },
        {
            name: "雑談部屋",
            tag: "交流と息抜きの場",
            desc: "AIや開発の話に限らず、日常の出来事や趣味の話など、何でもありのフリートークスペースです。勉強の合間の息抜きや、メンバー同士の「横のつながり」を作るきっかけの場所として、気軽なコミュニケーションが行われています。",
            icon: Coffee,
            color: "bg-pink-400"
        }
    ];

    return (
        <section className="py-16 md:py-24 bg-white relative overflow-hidden">
            {/* Background Decoration Image - Positioned on the LEFT */}
            <div className="container mx-auto px-4 relative z-10">
                {/* Background Decoration Image - Container Relative (Left) */}
                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[300px] h-[300px] md:w-[500px] md:h-[500px] lg:w-[750px] lg:h-[750px] pointer-events-none z-[-1] translate-x-0 lg:-translate-x-10 animate-float animation-delay-2000">
                    <Image
                        src="/community-decoration-final.png"
                        alt=""
                        fill
                        className="object-contain opacity-40 mix-blend-multiply"
                    />
                </div>
                {/* Content aligned to the RIGHT to balance the image on the left */}
                <div className="max-w-3xl ml-auto relative z-20">
                    <h2 className="text-3xl sm:text-5xl md:text-7xl font-black text-black tracking-tighter mb-6 leading-tight" style={{ fontFamily: 'var(--font-jp)' }}>
                        仲間と繋がる
                    </h2>

                    <p className="text-lg sm:text-xl font-bold text-black mb-10 leading-relaxed max-w-2xl">
                        一人で悩む時間は終わり。専用Discordチャンネルで、同じ志を持つ仲間と知識を共有し、共に成長できる。
                    </p>

                    <Dialog>
                        <DialogTrigger asChild>
                            <div>
                                <WaveButton
                                    text="チャンネル紹介を見る"
                                    hoverText="CHECK！"
                                    className="w-48 h-12 rounded-md border-2 border-black shadow-[4px_4px_0px_0px_#000000]"
                                />
                            </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-5xl w-[95vw] bg-white border-4 border-black p-0 overflow-hidden rounded-xl">
                            <div className="max-h-[85vh] overflow-y-auto" style={{ fontFamily: 'var(--font-jp)' }}>
                                <div className="p-6 sm:p-10">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl sm:text-4xl font-black mb-8 border-b-4 border-black pb-4 inline-block">
                                            コミュニティのチャンネル例
                                        </DialogTitle>
                                    </DialogHeader>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {channels.map((channel, index) => (
                                            <div key={index} className={`bg-white border-2 border-black p-6 rounded-lg hover:bg-gray-50 transition-colors ${index === channels.length - 1 ? 'md:col-span-2' : ''}`}>
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 bg-sky-400 rounded-full border-2 border-black flex items-center justify-center">
                                                            <channel.icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-black text-xl flex items-center gap-1">
                                                                {channel.isLibrary ? '== ' : '# '}{channel.name}{channel.isLibrary ? ' ==' : ''}
                                                            </h4>
                                                            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-black inline-block mt-1">
                                                                {channel.tag}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="font-bold text-gray-600 leading-relaxed text-sm sm:text-base">
                                                    {channel.desc}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </section>
    );
}
