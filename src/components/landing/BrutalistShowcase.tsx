"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { ArrowLeft, ArrowRight, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BrutalistShowcase() {
    const videos = useQuery(api.videos.getPublishedVideos);
    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 4;

    // Mock data for initial render or if no videos (to show the design)
    const isLoading = videos === undefined;

    // Calculate pagination
    const totalVideos = videos ? videos.length : 0;
    const totalPages = Math.ceil(totalVideos / itemsPerPage);

    // Chunk videos into pages
    const pages = [];
    if (videos && videos.length > 0) {
        for (let i = 0; i < videos.length; i += itemsPerPage) {
            pages.push(videos.slice(i, i + itemsPerPage));
        }
    }

    const nextPage = () => {
        setCurrentPage((prev) => (prev + 1) % (totalPages || 1));
    };

    const prevPage = () => {
        setCurrentPage((prev) => (prev - 1 + (totalPages || 1)) % (totalPages || 1));
    };

    return (
        <section className="py-16 bg-pop-yellow border-b-4 border-black relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(#000 2px, transparent 2px)", backgroundSize: "30px 30px" }}></div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col lg:flex-row gap-12 items-center">

                    {/* Left Column: Text Content */}
                    <div className="lg:w-1/3 text-left">
                        <h2 className="text-5xl md:text-6xl font-black text-black uppercase tracking-tighter mb-6 leading-tight">
                            HANDS-ON <br />
                            <span className="text-white text-stroke-2">SHOWCASE</span>
                        </h2>
                        <p className="text-xl font-bold text-black mb-6">
                            実際に作成するプロジェクトの一部をチラ見せ。<br />
                            手を動かして、AIを使い倒せ。
                        </p>

                        {/* Navigation Controls (Desktop) */}
                        <div className="hidden lg:flex gap-4 relative z-[60]">
                            <Button
                                onClick={prevPage}
                                disabled={totalPages <= 1}
                                size="icon"
                                className="w-14 h-14 rounded-full bg-white text-black border-4 border-black brutal-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </Button>
                            <Button
                                onClick={nextPage}
                                disabled={totalPages <= 1}
                                size="icon"
                                className="w-14 h-14 rounded-full bg-black text-white border-4 border-black brutal-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50"
                            >
                                <ArrowRight className="w-6 h-6" />
                            </Button>
                        </div>
                    </div>

                    {/* Right Column: Corkboard Carousel */}
                    <div className="lg:w-2/3 w-full">
                        <div
                            className="flex transition-transform duration-500 ease-in-out pointer-events-none"
                            style={{ transform: `translateX(-${currentPage * 100}%)` }}
                        >
                            {isLoading ? (
                                // Loading Skeletons (Single Page)
                                <div className="w-full flex-shrink-0 pointer-events-auto">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8 p-8 pb-16 min-h-[400px]">
                                        {Array.from({ length: 4 }).map((_, i) => (
                                            <div key={i} className="w-full aspect-video bg-white border-4 border-black rounded-xl brutal-shadow animate-pulse transform rotate-1"></div>
                                        ))}
                                    </div>
                                </div>
                            ) : pages.length > 0 ? (
                                pages.map((pageVideos, pageIndex) => (
                                    <div
                                        key={pageIndex}
                                        className={`w-full flex-shrink-0 transition-opacity duration-300 ${pageIndex === currentPage ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                                    >
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8 p-8 pb-16 min-h-[400px]">
                                            {pageVideos.map((video, index) => {
                                                // Random rotation for corkboard effect
                                                // Use global index to keep rotation consistent across pages
                                                const globalIndex = pageIndex * itemsPerPage + index;
                                                const rotations = ['rotate-1', '-rotate-1', 'rotate-2', '-rotate-2'];
                                                const rotation = rotations[globalIndex % rotations.length];

                                                return (
                                                    <div
                                                        key={video._id}
                                                        className={`w-full group relative transform ${rotation} hover:z-50 hover-shake transition-all duration-300`}
                                                        style={{ transformOrigin: '50% -4px' }}
                                                    >
                                                        {/* Pin element */}
                                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-500 border-2 border-black z-20 shadow-sm"></div>

                                                        <div className="bg-black rounded-xl border-4 border-black overflow-hidden aspect-video relative brutal-shadow group-hover:shadow-none transition-all duration-200">
                                                            <img
                                                                src={video.thumbnailUrl || `https://image.mux.com/${video.muxPlaybackId}/thumbnail.png?width=400&height=225&fit_mode=smart`}
                                                                alt={video.title}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>

                                                        {/* Title tooltip on hover - Full width, no truncate */}
                                                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 translate-y-full w-[150%] opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-30 flex justify-center">
                                                            <h3 className="font-black text-sm bg-white border-2 border-black px-4 py-2 shadow-[4px_4px_0px_0px_#000000] text-black text-center leading-tight whitespace-normal break-words">
                                                                {video.title}
                                                            </h3>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                // Empty state
                                <div className="w-full flex-shrink-0">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 p-8 pb-16 min-h-[400px]">
                                        <div className="col-span-2 flex items-center justify-center h-64 border-4 border-black bg-white brutal-shadow rounded-xl transform -rotate-1">
                                            <p className="font-bold text-xl">COMING SOON...</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Mobile Navigation Controls */}
                        <div className="flex lg:hidden justify-center gap-4 mt-8">
                            <Button
                                onClick={prevPage}
                                disabled={totalPages <= 1}
                                size="icon"
                                className="w-12 h-12 rounded-full bg-white text-black border-4 border-black brutal-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <Button
                                onClick={nextPage}
                                disabled={totalPages <= 1}
                                size="icon"
                                className="w-12 h-12 rounded-full bg-black text-white border-4 border-black brutal-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50"
                            >
                                <ArrowRight className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
