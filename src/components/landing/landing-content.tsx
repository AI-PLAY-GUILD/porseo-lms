"use client";

import { BookOpen, Calendar, Code, Sparkles, Users, Video } from "lucide-react";
import { useEffect, useRef } from "react";

const contentItems = [
    {
        title: "Video Courses",
        description: "体系的に学べる動画講座。基礎から応用まで、自分のペースで学習できます。",
        icon: Video,
        className: "md:col-span-2 md:row-span-2",
        bg: "bg-gradient-to-br from-blue-500/20 to-violet-500/20",
    },
    {
        title: "Hands-on Workshops",
        description: "週末開催のハンズオン。実際に手を動かしながら技術を習得します。",
        icon: Calendar,
        className: "md:col-span-1 md:row-span-1",
        bg: "bg-white/5",
    },
    {
        title: "Project Reviews",
        description: "プロのエンジニアによるコードレビュー。実践的なフィードバックが得られます。",
        icon: Code,
        className: "md:col-span-1 md:row-span-1",
        bg: "bg-white/5",
    },
    {
        title: "Tech Articles",
        description: "最新技術の解説記事。深い洞察と技術的な詳細を学べます。",
        icon: BookOpen,
        className: "md:col-span-1 md:row-span-1",
        bg: "bg-white/5",
    },
    {
        title: "Community Events",
        description: "LT会やハッカソンなど、メンバー同士が交流できるイベントを定期開催。",
        icon: Users,
        className: "md:col-span-1 md:row-span-1",
        bg: "bg-white/5",
    },
    {
        id: "showcase",
        title: "Community Showcase",
        description: "活気あふれるコミュニティの様子",
        icon: Sparkles,
        className: "md:col-span-2 md:row-span-1",
        bg: "bg-gradient-to-r from-fuchsia-500/20 to-purple-500/20",
    },
];

const showcaseImages = [
    "/placeholder-1.jpg",
    "/placeholder-2.jpg",
    "/placeholder-3.jpg",
    "/placeholder-4.jpg",
    "/placeholder-5.jpg",
    "/placeholder-6.jpg",
];

export function LandingContent() {
    const scrollerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!scrollerRef.current) return;

        const scrollerContent = scrollerRef.current.querySelector(".scroller-inner");
        if (!scrollerContent) return;

        const scrollerContentArray = Array.from(scrollerContent.children);

        // Check if we already duplicated (React strict mode double invoke protection)
        if (scrollerContent.children.length > showcaseImages.length) return;

        scrollerContentArray.forEach((item) => {
            const duplicatedItem = item.cloneNode(true);
            (duplicatedItem as HTMLElement).setAttribute("aria-hidden", "true");
            scrollerContent.appendChild(duplicatedItem);
        });
    }, []);

    return (
        <section className="py-24 relative z-10">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        Rich Content
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                        あなたの成長を加速させる、多様な学習コンテンツ
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[200px]">
                    {contentItems.map((item, index) => (
                        <div
                            key={index}
                            className={`group relative p-6 rounded-3xl border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300 ${item.className} ${item.bg} backdrop-blur-sm`}
                        >
                            {/* Background Glow */}
                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                            {/* Special Rendering for Showcase */}
                            {item.id === "showcase" ? (
                                <div className="relative h-full flex flex-col">
                                    <div className="flex items-center gap-3 mb-4 z-10">
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                            <item.icon className="w-4 h-4 text-white" />
                                        </div>
                                        <h3 className="text-lg font-bold text-white">{item.title}</h3>
                                    </div>

                                    {/* Marquee Container */}
                                    <div
                                        ref={scrollerRef}
                                        className="scroller relative flex-1 w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_10%,white_90%,transparent)]"
                                    >
                                        <div className="scroller-inner flex gap-4 py-2 w-max animate-scroll">
                                            {showcaseImages.map((_src, idx) => (
                                                <div
                                                    key={idx}
                                                    className="relative w-[120px] h-[80px] rounded-lg overflow-hidden border border-white/10 bg-gray-800 shrink-0"
                                                >
                                                    <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-xs font-bold">
                                                        Img {idx + 1}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Standard Card Content */
                                <div className="relative z-10 h-full flex flex-col justify-between">
                                    <div>
                                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                            <item.icon className="w-5 h-5 text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                                        <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
