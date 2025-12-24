"use client";

import { Github, Twitter, Linkedin } from "lucide-react";
import Link from "next/link";

const team = [
    {
        name: "SHUN",
        role: "FOUNDER / AI EXPLORER",
        description: "寝ても覚めてもAI。新しい技術を見つけると試さずにはいられない。",
        color: "bg-pop-yellow",
        image: "🦁",
        imageUrl: "" // Add image URL here
    },
    {
        name: "AI AGENT",
        role: "COMMUNITY MANAGER",
        description: "24時間365日、コミュニティを監視...いや、見守っています。",
        color: "bg-pop-green",
        image: "🤖",
        imageUrl: "" // Add image URL here
    },
    {
        name: "DEV GURU",
        role: "TECH LEAD",
        description: "コードで世界を変える。バグは友達、仕様変更は恋人。",
        color: "bg-pop-red",
        image: "⚡️",
        imageUrl: "" // Add image URL here
    }
];

export function BrutalistTeam() {
    return (
        <section id="team" className="py-24 bg-pop-purple border-b-4 border-black relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full border-4 border-black opacity-20 animate-blob"></div>
            <div className="absolute bottom-10 right-10 w-48 h-48 bg-pop-yellow rounded-full border-4 border-black opacity-20 animate-blob animation-delay-2000"></div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-20">
                    <h2 className="text-5xl md:text-7xl font-black mb-6 text-white uppercase tracking-tighter text-stroke-2">
                        MEET THE <span className="bg-white text-black px-4 transform rotate-2 inline-block border-4 border-black">CREW</span>
                    </h2>
                    <p className="text-xl font-bold text-white max-w-2xl mx-auto bg-black/20 p-4 rounded-xl backdrop-blur-sm border-2 border-black/50">
                        このクレイジーなコミュニティを運営する<br />
                        愉快なメンバーたち。
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {team.map((member, index) => (
                        <div
                            key={index}
                            className="group relative"
                        >
                            {/* Card */}
                            <div className="bg-white rounded-2xl border-4 border-black p-8 flex flex-col items-center text-center relative z-10 transition-transform duration-300 group-hover:-translate-y-4 group-hover:rotate-1 h-full">
                                {/* Avatar */}
                                <div className={`w-32 h-32 rounded-full ${member.color} border-4 border-black flex items-center justify-center text-6xl mb-6 shadow-[4px_4px_0px_0px_#000000] group-hover:scale-110 transition-transform duration-300 overflow-hidden`}>
                                    {member.imageUrl ? (
                                        <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover" />
                                    ) : (
                                        member.image
                                    )}
                                </div>

                                <h3 className="text-3xl font-black text-black mb-2 uppercase tracking-tight">
                                    {member.name}
                                </h3>
                                <div className="inline-block bg-black text-white px-3 py-1 font-bold text-sm rounded-full mb-6">
                                    {member.role}
                                </div>
                                <p className="text-black font-bold leading-relaxed mb-8 flex-grow">
                                    {member.description}
                                </p>

                                {/* Social Links */}
                                <div className="flex gap-4 mt-auto">
                                    <Link href="#" className="w-12 h-12 rounded-full bg-black text-white border-2 border-black flex items-center justify-center hover:bg-gray-800 transition-colors brutal-shadow-sm hover:translate-y-1 hover:shadow-none">
                                        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" aria-hidden="true">
                                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                        </svg>
                                    </Link>
                                </div>
                            </div>

                            {/* Shadow Card (for depth effect) */}
                            <div className={`absolute inset-0 ${member.color} rounded-2xl border-4 border-black translate-x-4 translate-y-4 -z-10`}></div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
