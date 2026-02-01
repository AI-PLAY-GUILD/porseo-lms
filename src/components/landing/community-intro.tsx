"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import Image from "next/image";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

export function CommunityIntro() {
    const containerRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        if (!titleRef.current || !contentRef.current) return;

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: containerRef.current,
                start: "top 80%",
                end: "bottom 20%",
                toggleActions: "play none none reverse"
            }
        });

        tl.fromTo(titleRef.current,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
        )
            .fromTo(contentRef.current,
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
                "-=0.4"
            );
    }, { scope: containerRef });

    return (
        <section id="features" ref={containerRef} className="relative py-24 px-4 overflow-hidden bg-white">
            {/* Logo watermark background */}
            {/* Logo watermark background */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.08] pointer-events-none translate-x-0 md:translate-x-64">
                <Image
                    src="/logo-3d.png"
                    alt="AI Play Guild Logo"
                    width={800}
                    height={800}
                    className="object-contain scale-125 md:scale-100"
                    priority
                />
            </div>

            <div className="max-w-4xl mx-auto relative z-10">
                <h2
                    ref={titleRef}
                    className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 opacity-0"
                    style={{ fontFamily: 'var(--font-jp)' }}
                >
                    AI PLAY GUILDとは
                </h2>

                <div
                    ref={contentRef}
                    className="space-y-6 text-lg md:text-xl text-gray-700 leading-relaxed opacity-0"
                >
                    <p className="font-semibold text-blue-600">
                        AIで遊びAIに熱狂する人を増やしたい。
                    </p>

                    <p>
                        AIはもっと面白くて楽しい、遊び道具であるはず。
                    </p>

                    <div className="pl-6 border-l-4 border-blue-400 space-y-2 italic">
                        <p>「AIでこんなこともできるの？超楽しい！」</p>
                        <p>「じゃあ創りたかったあのアプリも自分で作れるんじゃ、、」</p>
                    </div>

                    <p>
                        気づいたら毎日AIに没頭していた。。
                    </p>

                    <p className="text-xl md:text-2xl font-semibold text-gray-900 pt-4">
                        ここは楽しみながら、AIを自己実現のパートナーに変えるコミュニティです。
                    </p>
                </div>
            </div>
        </section>
    );
}
