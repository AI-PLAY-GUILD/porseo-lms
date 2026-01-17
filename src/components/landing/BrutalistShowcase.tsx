"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ParticleBackground } from "./particle-background";

gsap.registerPlugin(ScrollTrigger);

export function BrutalistShowcase() {
    const videos = useQuery(api.videos.getPublishedVideos);
    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 4;
    const containerRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLDivElement>(null);

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

    useGSAP(() => {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: containerRef.current,
                start: "top 70%",
                end: "bottom bottom",
                toggleActions: "play none none reverse",
            }
        });

        tl.fromTo(titleRef.current,
            { y: 50, opacity: 0 },
            { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
        );

    }, { scope: containerRef });

    return (
        <section ref={containerRef} className="py-12 md:py-24 relative overflow-hidden bg-white">
            <div className="absolute inset-0 z-0 opacity-50 pointer-events-none">
                <ParticleBackground />
            </div>
            {/* Background pattern */}
            <div className="absolute top-0 right-0 w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-blue-50 rounded-full blur-[100px] -z-10"></div>
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-indigo-50 rounded-full blur-[100px] -z-10"></div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col lg:flex-row gap-8 md:gap-12 items-center">

                    {/* Left Column: Text Content */}
                    <div ref={titleRef} className="lg:w-1/3 text-left">
                        <h2 className="text-3xl sm:text-5xl md:text-6xl font-thin text-foreground tracking-tighter mb-6 leading-tight">
                            豊富な<br />
                            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                                アーカイブ
                            </span>
                        </h2>
                        <p className="text-lg sm:text-xl font-light text-muted-foreground mb-8 leading-relaxed">
                            ４０種類以上のアーカイブ動画が見放題！<br />
                            見ながらすぐに実践して、AIを遊び倒そう！
                        </p>

                        {/* Navigation Controls (Desktop) */}
                        <div className="hidden lg:flex gap-4 relative z-[60]">
                            <Button
                                onClick={prevPage}
                                disabled={totalPages <= 1}
                                size="icon"
                                variant="outline"
                                className="w-14 h-14 rounded-full border border-blue-200/20 bg-blue-500/5 text-blue-600 hover:bg-blue-500/10 backdrop-blur-md transition-all duration-300 disabled:opacity-50 disabled:hover:bg-transparent"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </Button>
                            <Button
                                onClick={nextPage}
                                disabled={totalPages <= 1}
                                size="icon"
                                variant="default"
                                className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-blue-600/10 text-blue-600 hover:bg-blue-600/20 border border-blue-200/20 backdrop-blur-md hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
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
                                                    className="group relative rounded-2xl overflow-hidden shadow-sm border border-border/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white"
                                                >
                                                    <div className="aspect-video relative overflow-hidden">
                                                        <img
                                                            src={video.thumbnailUrl || `https://image.mux.com/${video.muxPlaybackId}/thumbnail.png?width=400&height=225&fit_mode=smart`}
                                                            alt={video.title}
                                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                        />
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
                                className="w-12 h-12 rounded-full border border-blue-200/20 bg-blue-500/5 text-blue-600 hover:bg-blue-500/10 backdrop-blur-md transition-all duration-300 disabled:opacity-50"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <Button
                                onClick={nextPage}
                                disabled={totalPages <= 1}
                                size="icon"
                                variant="default"
                                className="w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-blue-600/10 text-blue-600 hover:bg-blue-600/20 border border-blue-200/20 backdrop-blur-md hover:scale-105 disabled:opacity-50"
                            >
                                <ArrowRight className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            {/* Bottom Gradient for Natural Transition */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-white z-10 pointer-events-none"></div>
        </section>
    );
}
