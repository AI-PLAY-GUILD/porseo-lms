"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ParticleBackground } from "./particle-background";

gsap.registerPlugin(ScrollTrigger);

export function BrutalistAbout() {
    const containerRef = useRef<HTMLDivElement>(null);
    const leftColRef = useRef<HTMLDivElement>(null);
    const rightColRef = useRef<HTMLDivElement>(null);
    const logoRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: containerRef.current,
                start: "top 70%",
                end: "bottom bottom",
                toggleActions: "play none none reverse",
            }
        });

        // 1. Left Column Animation (Text)
        tl.fromTo(leftColRef.current,
            { x: -50, opacity: 0 },
            { x: 0, opacity: 1, duration: 1, ease: "power3.out" }
        );

        // 2. Right Column Animation (Logo)
        tl.fromTo(rightColRef.current,
            { scale: 0.8, opacity: 0, rotation: 10 },
            { scale: 1, opacity: 1, rotation: 0, duration: 1.2, ease: "elastic.out(1, 0.7)" },
            "-=0.8"
        );

        // Logo Floating Animation (Enhanced for 3D feel)
        if (logoRef.current) {
            gsap.to(logoRef.current, {
                y: -20,
                rotation: 5,
                scale: 1.05,
                duration: 3,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });
        }

    }, { scope: containerRef });

    // Mouse Move 3D Tilt Effect for Logo
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!logoRef.current) return;

        const { clientX, clientY } = e;
        const { left, top, width, height } = logoRef.current.getBoundingClientRect();
        const x = (clientX - left) / width - 0.5;
        const y = (clientY - top) / height - 0.5;

        gsap.to(logoRef.current, {
            rotationY: x * 20,
            rotationX: -y * 20,
            duration: 0.5,
            ease: "power2.out"
        });
    };

    const handleMouseLeave = () => {
        if (!logoRef.current) return;
        gsap.to(logoRef.current, {
            rotationY: 0,
            rotationX: 0,
            duration: 0.5,
            ease: "power2.out"
        });
    };

    return (
        <section ref={containerRef} id="about" className="py-16 md:py-32 relative overflow-hidden bg-white">
            <div className="absolute inset-0 z-0 opacity-60 pointer-events-none">
                <ParticleBackground />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col lg:flex-row gap-16 items-center mb-12 md:mb-24">

                    {/* Left Column: Text */}
                    <div ref={leftColRef} className="lg:w-1/2 text-left">
                        <h2 className="text-4xl md:text-7xl font-thin mb-8 md:mb-12 text-foreground tracking-tighter leading-tight">
                            AI PLAY GUILD<br />
                            <span className="font-thin">
                                とは？
                            </span>
                        </h2>

                        <div className="space-y-8">
                            <p className="text-2xl md:text-3xl font-light leading-relaxed text-foreground">
                                AIで遊び、<br />
                                AIに熱狂する人を増やしたい。
                            </p>

                            <p className="text-xl font-light text-muted-foreground">
                                AIはもっと面白い遊び道具である。
                            </p>

                            <div className="pl-4 border-l-2 border-primary/30 space-y-2 italic text-muted-foreground">
                                <p>「AIでこんなこともできるの？超楽しい！」</p>
                                <p>「創りたかったアプリも自分で作れるんじゃ、、」</p>
                            </div>

                            <p className="text-lg font-light text-muted-foreground leading-relaxed">
                                気づいたら毎日AIに没頭していた。<br />
                                そんな様に楽しみながら、AIを自己実現のパートナーに変えるコミュニティです。
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Logo & Cosmic Background */}
                    <div ref={rightColRef} className="lg:w-1/2 relative h-[300px] md:h-[500px] w-full flex items-center justify-center" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
                        {/* Cosmic Canvas Background */}
                        {/* Cosmic Canvas Background */}
                        <div className="absolute inset-0 w-full h-full pointer-events-none opacity-60">
                            <ParticleBackground />
                        </div>

                        <div className="relative w-full h-full max-w-md mx-auto flex items-center justify-center perspective-1000">
                            {/* Logo in Center */}
                            <div ref={logoRef} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 md:w-[500px] md:h-[500px] z-20" style={{ transformStyle: "preserve-3d" }}>
                                <img
                                    src="/guild_logo_3d_v3.png"
                                    alt="AI PLAY GUILD 3D Logo"
                                    className="w-full h-full object-contain relative z-10"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Gradient for Natural Transition */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-background z-10 pointer-events-none"></div>
        </section>
    );
}
