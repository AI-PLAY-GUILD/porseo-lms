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
        <section className="py-24 bg-background relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] -z-10"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[100px] -z-10"></div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col lg:flex-row gap-12 items-center">

                    {/* Left Column: Text Content */}
                    <div className="lg:w-1/3 text-left">
                        <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-foreground tracking-tight mb-6 leading-tight">
                            HANDS-ON <br />
                            <span className="text-gradient">SHOWCASE</span>
                        </h2>
                        <p className="text-lg sm:text-xl font-medium text-muted-foreground mb-8 leading-relaxed">
                            過去のハンズオン動画が見放題！<br />
                            見ながらすぐに実践して、AIを遊び倒そう！
                        </p>

                        {/* Navigation Controls (Desktop) */}
                        <div className="hidden lg:flex gap-4 relative z-[60]">
                            <Button
                                onClick={prevPage}
                                disabled={totalPages <= 1}
                                size="icon"
                                variant="outline"
                                className="w-14 h-14 rounded-full border-border hover:bg-secondary hover:text-primary transition-all disabled:opacity-50"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </Button>
                            <Button
                                onClick={nextPage}
                                disabled={totalPages <= 1}
                                size="icon"
                                variant="gradient"
                                className="w-14 h-14 rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all disabled:opacity-50"
                            >
                                <ArrowRight className="w-6 h-6" />
                            </Button>
                        </div>
                    </div>

                    {/* Right Column: Carousel */}
                    <div className="lg:w-2/3 w-full">
                        <div
                            className="flex transition-transform duration-500 ease-in-out pointer-events-none"
                            style={{ transform: `translateX(-${currentPage * 100}%)` }}
                        >
                            {isLoading ? (
                                // Loading Skeletons (Single Page)
                                <div className="w-full flex-shrink-0 pointer-events-auto">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4">
                                        {Array.from({ length: 4 }).map((_, i) => (
                                            <div key={i} className="w-full aspect-video bg-muted rounded-2xl animate-pulse"></div>
                                        ))}
                                    </div>
                                </div>
                            ) : pages.length > 0 ? (
                                pages.map((pageVideos, pageIndex) => (
                                    <div
                                        key={pageIndex}
                                        className={`w-full flex-shrink-0 transition-opacity duration-300 ${pageIndex === currentPage ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                                    >
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4">
                                            {pageVideos.map((video) => (
                                                <div
                                                    key={video._id}
                                                    className="group relative rounded-2xl overflow-hidden shadow-soft hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white"
                                                >
                                                    <div className="aspect-video relative overflow-hidden">
                                                        <img
                                                            src={video.thumbnailUrl || `https://image.mux.com/${video.muxPlaybackId}/thumbnail.png?width=400&height=225&fit_mode=smart`}
                                                            alt={video.title}
                                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                        />
                                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                            <PlayCircle className="w-12 h-12 text-white drop-shadow-lg" />
                                                        </div>
                                                    </div>
                                                    <div className="p-4">
                                                        <h3 className="font-bold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                                                            {video.title}
                                                        </h3>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                // Empty state
                                <div className="w-full flex-shrink-0">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 p-8 min-h-[400px]">
                                        <div className="col-span-2 flex items-center justify-center h-64 bg-muted/30 rounded-2xl border border-dashed border-muted-foreground/20">
                                            <p className="font-medium text-muted-foreground">COMING SOON...</p>
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
                                variant="outline"
                                className="w-12 h-12 rounded-full border-border hover:bg-secondary hover:text-primary transition-all disabled:opacity-50"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <Button
                                onClick={nextPage}
                                disabled={totalPages <= 1}
                                size="icon"
                                variant="gradient"
                                className="w-12 h-12 rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all disabled:opacity-50"
                            >
                                <ArrowRight className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            {/* Bottom Gradient for Natural Transition */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-[#f6f6f8] dark:to-[#101622] z-10 pointer-events-none"></div>
        </section>
    );
}
