"use client";

import { WaveButton } from "@/components/ui/wave-button";
import Image from "next/image";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trophy, Code2, Rocket } from "lucide-react";

export function BrutalistHackathon() {


    return (
        <section className="py-16 md:py-24 bg-white relative overflow-hidden">
            {/* Background Decoration Image - Positioned on the LEFT */}
            <div className="container mx-auto px-4 relative z-10">
                {/* Background Decoration Image - Container Relative (Left) */}
                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[300px] h-[300px] md:w-[500px] md:h-[500px] lg:w-[750px] lg:h-[750px] pointer-events-none z-[-1] translate-x-0 lg:-translate-x-10 animate-float animation-delay-3000">
                    <Image
                        src="/hackathon-decoration-final.png"
                        alt=""
                        fill
                        className="object-contain opacity-40 mix-blend-multiply"
                    />
                </div>
                {/* Content aligned to the RIGHT, allowing overlap */}
                <div className="max-w-3xl ml-auto text-left relative z-20">
                    <h2 className="text-3xl sm:text-5xl md:text-7xl font-black text-black tracking-tighter mb-6 leading-tight" style={{ fontFamily: 'var(--font-jp)' }}>
                        ハッカソン開催
                    </h2>

                    <p className="text-lg sm:text-xl font-bold text-black mb-10 leading-relaxed max-w-2xl">
                        インプットだけの毎日にさよなら。<br />
                        自分の成長を確かめ、社会実装への第一歩を踏み出す場所です。
                    </p>

                    <Dialog>
                        <DialogTrigger asChild>
                            <div>
                                <WaveButton
                                    text="開催実績を見る"
                                    hoverText="CHECK！"
                                    className="w-40 h-12 rounded-md border-2 border-black shadow-[4px_4px_0px_0px_#000000]"
                                />
                            </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl w-[95vw] bg-white border-4 border-black p-0 overflow-hidden rounded-xl">
                            <div className="max-h-[85vh] overflow-y-auto" style={{ fontFamily: 'var(--font-jp)' }}>
                                <div className="p-6 sm:p-10">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl sm:text-4xl font-black mb-6 border-b-4 border-black pb-4 inline-block">
                                            ハッカソン実績 <span className="text-base sm:text-xl font-normal block sm:inline sm:ml-2">-WEEKEND HACKATHON-</span>
                                        </DialogTitle>
                                    </DialogHeader>

                                    <div className="mb-8 mx-auto max-w-xs w-full aspect-square border-4 border-black rounded-lg overflow-hidden shadow-lg relative bg-black">
                                        <Image
                                            src="/hackathon-cat.png"
                                            alt="Weekend Hackathon"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>

                                    <h3 className="text-xl sm:text-2xl font-black mb-4">
                                        週末にアプリ開発チャレンジ！
                                    </h3>
                                    <p className="text-base sm:text-lg font-bold text-gray-700 mb-8 leading-relaxed">
                                        「今週末、何か作ってみない？」<br />
                                        このハッカソンはそんな気軽な呼びかけから始まりました。<br />
                                        楽しんで作って、完成したらデプロイURLや動画で提出し、１作品ずつ運営がコメントしました。
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-white border-2 border-black p-5 rounded-lg hover:translate-x-[2px] hover:translate-y-[2px] shadow-[4px_4px_0px_0px_#000000] hover:shadow-[2px_2px_0px_0px_#000000] transition-all">
                                            <div className="w-10 h-10 bg-blue-400 rounded-full border-2 border-black flex items-center justify-center mb-3">
                                                <Code2 className="w-5 h-5 text-white" strokeWidth={3} />
                                            </div>
                                            <h4 className="font-black text-lg mb-2">ルール自由・初心者歓迎</h4>
                                            <p className="font-bold text-sm text-gray-600 leading-relaxed">
                                                Claude Artifacts、v0、Difyなど手段は問いません。既存アプリの拡張でもOK。とにかく「動くもの」を作れば提出完了でした！
                                            </p>
                                        </div>

                                        <div className="bg-white border-2 border-black p-5 rounded-lg hover:translate-x-[2px] hover:translate-y-[2px] shadow-[4px_4px_0px_0px_#000000] hover:shadow-[2px_2px_0px_0px_#000000] transition-all">
                                            <div className="w-10 h-10 bg-yellow-400 rounded-full border-2 border-black flex items-center justify-center mb-3">
                                                <Trophy className="w-5 h-5 text-white" strokeWidth={3} />
                                            </div>
                                            <h4 className="font-black text-lg mb-2">豪華賞金＆プライズ</h4>
                                            <p className="font-bold text-sm text-gray-600 leading-relaxed">
                                                優勝賞金1万円に加え、運営との技術相談チケットや、上位入賞者のX拡散サポートも。あなたの実績作りを全力応援しました。
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-8 text-center">
                                        <p className="font-bold text-blue-600 text-lg">
                                            今後は企業連携のハッカソンも開催予定です。
                                        </p>
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
