"use client";

import { WaveButton } from "@/components/ui/wave-button";
import Image from "next/image";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check } from "lucide-react";

export function BrutalistLearning() {
    const features = [
        "学習進捗の可視化とトラッキング",
        "毎日の学習継続ランク機能",
        "獲得スキルと経験値のグラフ化",
        "コミュニティ内ランキング表示"
    ];

    return (
        <section className="py-16 md:py-24 bg-white relative overflow-hidden">
            {/* Background Decoration Image */}
            <div className="container mx-auto px-4 relative z-10">
                {/* Background Decoration Image - Container Relative (Right) */}
                <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[300px] h-[300px] md:w-[500px] md:h-[500px] lg:w-[750px] lg:h-[750px] pointer-events-none z-[-1] translate-x-0 lg:translate-x-10 animate-float animation-delay-1000">
                    <Image
                        src="/dashboard-decoration.png"
                        alt=""
                        fill
                        className="object-contain opacity-40 mix-blend-multiply"
                    />
                </div>
                {/* Content aligned to the LEFT, allowing overlap */}
                <div className="w-full lg:w-2/3 text-left lg:pl-32 relative z-20">
                    <h2 className="text-3xl sm:text-5xl md:text-7xl font-black text-black tracking-tighter mb-6 leading-tight" style={{ fontFamily: 'var(--font-jp)' }}>
                        専用の学習ダッシュボード
                    </h2>

                    <p className="text-lg sm:text-xl font-bold text-black mb-10 leading-relaxed">
                        自分専用のダッシュボードで、学習の進捗を可視化。ランクシステムや学習分析機能も搭載されており、モチベーションを維持しながら学習を進められる。
                    </p>

                    <Dialog>
                        <DialogTrigger asChild>
                            <div>
                                <WaveButton
                                    text="機能を見る"
                                    hoverText="CHECK！"
                                    className="w-40 h-12 rounded-md border-2 border-black shadow-[4px_4px_0px_0px_#000000]"
                                />
                            </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl w-[95vw] bg-white border-4 border-black p-0 overflow-hidden rounded-xl">
                            <div className="max-h-[85vh] overflow-y-auto">
                                <div className="p-6 sm:p-10">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl sm:text-4xl font-black mb-6 border-b-4 border-black pb-4 inline-block">
                                            学習を加速させるダッシュボード機能
                                        </DialogTitle>
                                    </DialogHeader>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-white border-2 border-black p-6 rounded-lg shadow-[4px_4px_0px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000000] transition-all">
                                            <h4 className="font-black text-xl mb-3 flex items-center gap-2">
                                                <span className="bg-sky-400 text-white w-8 h-8 flex items-center justify-center rounded-full border-2 border-black text-sm">01</span>
                                                学習ランクシステム
                                            </h4>
                                            <p className="font-bold text-gray-600 leading-relaxed">
                                                動画を完了するたびにランクがアップ。<br />
                                                完了数に応じてビギナーからプラチナへ、成長を可視化。
                                            </p>
                                        </div>

                                        <div className="bg-white border-2 border-black p-6 rounded-lg shadow-[4px_4px_0px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000000] transition-all">
                                            <h4 className="font-black text-xl mb-3 flex items-center gap-2">
                                                <span className="bg-pink-400 text-white w-8 h-8 flex items-center justify-center rounded-full border-2 border-black text-sm">02</span>
                                                学習統計データ
                                            </h4>
                                            <p className="font-bold text-gray-600 leading-relaxed">
                                                総視聴時間や完了した動画数を一目で確認。<br />
                                                自分の積み上げた成果を数字で実感できる。
                                            </p>
                                        </div>

                                        <div className="bg-white border-2 border-black p-6 rounded-lg shadow-[4px_4px_0px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000000] transition-all">
                                            <h4 className="font-black text-xl mb-3 flex items-center gap-2">
                                                <span className="bg-yellow-400 text-white w-8 h-8 flex items-center justify-center rounded-full border-2 border-black text-sm">03</span>
                                                連続学習ストリーク
                                            </h4>
                                            <p className="font-bold text-gray-600 leading-relaxed">
                                                毎日の学習継続日数を記録。<br />
                                                途切らせたくない心理を刺激し、日々の学習を習慣化。
                                            </p>
                                        </div>

                                        <div className="bg-white border-2 border-black p-6 rounded-lg shadow-[4px_4px_0px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000000] transition-all">
                                            <h4 className="font-black text-xl mb-3 flex items-center gap-2">
                                                <span className="bg-green-400 text-white w-8 h-8 flex items-center justify-center rounded-full border-2 border-black text-sm">04</span>
                                                週間学習グラフ
                                            </h4>
                                            <p className="font-bold text-gray-600 leading-relaxed">
                                                直近7日間の学習時間をグラフで分析。<br />
                                                学習ペースを把握し、無理のない計画を立てられる。
                                            </p>
                                        </div>
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
