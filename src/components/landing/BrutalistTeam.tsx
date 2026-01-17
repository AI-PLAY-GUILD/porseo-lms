"use client";

import { Github, Twitter, Linkedin } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ParticleBackground } from "./particle-background";

gsap.registerPlugin(ScrollTrigger);

const team = [
    {
        name: "TAIYO",
        role: "COMMUNITY OWNER",
        description: "本ギルドの創設者。スライド作成支援アプリ『Kirigami』を開発・運営する現役大学生エンジニア。「理論より実装」を掲げ、手を動かす楽しさを全力で語ります。圧倒的な実演スピードで、AIの遊び方を独自の方法論でメンバーに伝え続けます！",
        image: "🦁",
        imageUrl: "https://pbs.twimg.com/profile_images/1958595510232915969/Wz8kSWMa_400x400.jpg",
        twitterUrl: "https://x.com/taiyo_ai_gakuse?s=20"
    },
    {
        name: "SUGURU",
        role: "CONTENTS OWNER",
        description: "株式会社Uravation代表。GPTs国内トップクラスの実績を持ち、大手企業のAI導入も支援。「作ったものをどう社会に届けるか」という出口戦略をサポートし、個人の遊びを、市場価値のある「成果」へと導きます！",
        image: "🤖",
        imageUrl: "https://pbs.twimg.com/profile_images/1765706549824221184/N0yR_7Sj_400x400.jpg",
        twitterUrl: "https://x.com/SuguruKun_ai?s=20"
    },
    {
        name: "SHUN",
        role: "CX OFFICER",
        description: "本ギルドのLP、学習管理システムの開発者。メンバーが迷わず、挫折せず、熱量を保ったまま走り続けられるよう、システムと体験（CX）のすべてを設計しています。「迷い」を取り除き、安心して「熱狂」できる場所を提供します！",
        image: "⚡️",
        imageUrl: "/images/shun_profile.png",
        twitterUrl: "https://x.com/porseo__ai"
    }
];

export function BrutalistTeam() {
    const containerRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLDivElement>(null);
    const cardsRef = useRef<HTMLDivElement>(null);

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

        if (cardsRef.current) {
            tl.fromTo(cardsRef.current.children,
                { y: 50, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.6, stagger: 0.2, ease: "power2.out" },
                "-=0.5"
            );
        }

    }, { scope: containerRef });

    return (
        <section ref={containerRef} id="team" className="py-12 md:py-24 relative overflow-hidden bg-white">
            <div className="absolute inset-0 z-0 opacity-50 pointer-events-none">
                <ParticleBackground />
            </div>
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-[400px] h-[400px] md:w-[800px] md:h-[800px] bg-gray-50 rounded-full blur-[120px] -z-10"></div>
            <div className="absolute bottom-0 right-0 w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-gray-50 rounded-full blur-[100px] -z-10"></div>

            <div className="container mx-auto px-4 relative z-10">
                <div ref={titleRef} className="text-center mb-10 md:mb-20">
                    <h2 className="text-3xl md:text-6xl font-thin mb-6 text-foreground tracking-tighter">
                        コミュニティ <span className="font-bold">運営チーム</span>
                    </h2>
                    <p className="text-xl font-light text-muted-foreground max-w-2xl mx-auto">
                        あなたの熱狂を最大化するために集まった、<br />
                        3名の領域別運営陣。
                    </p>
                </div>

                <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {team.map((member, index) => (
                        <div
                            key={index}
                            className="group relative"
                        >
                            {/* Card */}
                            <div className="bg-white rounded-3xl p-8 flex flex-col items-center text-center relative z-10 transition-all duration-300 hover:-translate-y-2 shadow-sm hover:shadow-xl border border-border/50 h-full">
                                {/* Avatar */}
                                <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-br from-gray-200 to-gray-300 mb-6 shadow-md group-hover:scale-105 transition-transform duration-300">
                                    <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center text-6xl">
                                        {member.imageUrl ? (
                                            <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover" />
                                        ) : (
                                            member.image
                                        )}
                                    </div>
                                </div>

                                <h3 className="text-2xl font-bold text-foreground mb-2 tracking-tight">
                                    {member.name}
                                </h3>
                                <div className="inline-block bg-secondary text-secondary-foreground px-4 py-1 font-semibold text-xs rounded-full mb-6">
                                    {member.role}
                                </div>
                                <p className="text-muted-foreground font-light leading-relaxed mb-8 flex-grow text-sm">
                                    {member.description}
                                </p>

                                {/* Social Links - Refined Button Design */}
                                <div className="flex gap-4 mt-auto">
                                    <Link
                                        href={member.twitterUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-600 border border-blue-200/20 backdrop-blur-md flex items-center justify-center hover:bg-blue-500/20 hover:scale-110 transition-all duration-300 shadow-sm"
                                    >
                                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
                                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                        </svg>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>


        </section>
    );
}
