"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PlayCircle } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Image from "next/image";
import { WaveButton } from "@/components/ui/wave-button";

export function BrutalistShowcase() {
    const videos = useQuery(api.videos.getPublishedVideos);

    return (
        <section className="py-16 md:py-24 bg-white relative overflow-hidden">
            {/* Background Decoration Image */}
            <div className="container mx-auto px-4 relative z-10">
                {/* Background Decoration Image - Container Relative */}
                <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[300px] h-[300px] md:w-[500px] md:h-[500px] lg:w-[750px] lg:h-[750px] pointer-events-none z-[-1] translate-x-0 lg:translate-x-10 animate-float">
                    <Image
                        src="/archive-decoration-yellow.png"
                        alt=""
                        fill
                        className="object-contain opacity-40 mix-blend-multiply"
                    />
                </div>
                <div className="flex flex-col lg:flex-row gap-12 items-center relative z-20">
                    {/* Content Column - Now full width but constrained by max-width for readability if needed, 
                        or allowed to overlap with the background image as per request "文字も被ってよく" */}
                    <div className="w-full lg:w-2/3 text-left lg:pl-32">
                        <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-black tracking-tighter mb-6 leading-tight" style={{ fontFamily: 'var(--font-jp)' }}>
                            豊富な講座アーカイブ
                        </h2>
                        <p className="text-lg sm:text-xl font-bold text-black mb-8 max-w-2xl">
                            過去のハンズオン動画が見放題！<br />
                            見ながらすぐに実践して、AIを遊び倒そう！
                        </p>

                        <div className="mb-8">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <div>
                                        <WaveButton
                                            text="アーカイブ例を見る"
                                            hoverText="CHECK！"
                                            className="w-48 h-12 rounded-md border-2 border-black shadow-[4px_4px_0px_0px_#000000]"
                                        />
                                    </div>
                                </DialogTrigger>
                                <DialogContent className="w-[95vw] md:w-full max-w-5xl max-h-[85vh] overflow-y-auto bg-[#FFFDF5] border-4 border-black p-5 sm:p-10 rounded-2xl sm:rounded-3xl focus:outline-none">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl sm:text-3xl font-black mb-6 border-b-4 border-black pb-4 inline-block">アーカイブ例</DialogTitle>
                                    </DialogHeader>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {videos?.map((video) => (
                                            <div key={video._id} className="group relative cursor-pointer">
                                                <div className="bg-white rounded-xl border-4 border-black overflow-hidden aspect-video relative brutal-shadow group-hover:translate-x-1 group-hover:translate-y-1 group-hover:shadow-none transition-all duration-200">
                                                    <img
                                                        src={video.thumbnailUrl || `https://image.mux.com/${video.muxPlaybackId}/thumbnail.png?width=400&height=225&fit_mode=smart`}
                                                        alt={video.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                        <PlayCircle className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                                                    </div>
                                                </div>
                                                <h3 className="mt-3 font-bold text-sm md:text-base leading-tight group-hover:text-blue-600 transition-colors break-words">
                                                    {video.title}
                                                </h3>
                                            </div>
                                        ))}
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
