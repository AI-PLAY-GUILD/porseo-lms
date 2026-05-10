"use client";

import Image from "next/image";
import Link from "next/link";

const team = [
    {
        name: "TAIYO",
        role: "COMMUNITY OWNER",
        description:
            "本ギルドの創設者。スライド作成支援アプリ『Kirigami』を開発・運営する現役大学生エンジニア。「理論より実装」を掲げ、手を動かす楽しさを全力で語ります。圧倒的な実演スピードで、AIの遊び方を独自の方法論でメンバーに伝え続けます！",
        color: "bg-pop-yellow",
        image: "🦁",
        imageUrl: "https://pbs.twimg.com/profile_images/1958595510232915969/Wz8kSWMa_400x400.jpg", // Add image URL here
        twitterUrl: "https://x.com/taiyo_ai_gakuse?s=20",
    },
    {
        name: "SHUN",
        role: "CX OFFICER",
        description:
            "本ギルドのLP、学習管理システムの開発者。メンバーが迷わず、挫折せず、熱量を保ったまま走り続けられるよう、システムと体験（CX）のすべてを設計しています。「迷い」を取り除き、安心して「熱狂」できる場所を提供します！",
        color: "bg-pop-red",
        image: "⚡️",
        imageUrl: "/images/shun-profile.jpg",
        twitterUrl: "https://x.com/porseo__ai",
    },
];

export function BrutalistTeam() {
    return (
        <section id="team" className="py-16 md:py-24 bg-white relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-20">
                    <h2
                        className="text-3xl sm:text-4xl md:text-6xl font-bold mb-6 text-black tracking-tighter"
                        style={{ fontFamily: "var(--font-jp)" }}
                    >
                        コミュニティ運営チーム
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {team.map((member, index) => (
                        <div key={index} className="group relative">
                            {/* Card */}
                            <div className="bg-white border-4 border-black p-8 flex flex-col items-center text-center relative z-10 h-full rounded-lg">
                                {/* Avatar */}
                                <div
                                    className={`w-32 h-32 bg-gray-100 border-4 border-black flex items-center justify-center text-6xl mb-6 overflow-hidden rounded-2xl`}
                                >
                                    {member.imageUrl ? (
                                        <Image
                                            src={member.imageUrl}
                                            alt={member.name}
                                            width={128}
                                            height={128}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        member.image
                                    )}
                                </div>

                                <h3
                                    className="text-3xl font-black text-black mb-2 uppercase tracking-tight"
                                    style={{ fontFamily: "var(--font-jp)" }}
                                >
                                    {member.name}
                                </h3>
                                <div className="inline-block bg-black text-white px-3 py-1 font-bold text-sm mb-6 rounded-md">
                                    {member.role}
                                </div>
                                <p
                                    className="text-black font-bold leading-relaxed mb-8 flex-grow text-sm sm:text-base"
                                    style={{ fontFamily: "var(--font-jp)" }}
                                >
                                    {member.description}
                                </p>

                                {/* Social Links */}
                                <div className="flex gap-4 mt-auto">
                                    <Link
                                        href={member.twitterUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-12 h-12 bg-black text-white border-2 border-black flex items-center justify-center hover:bg-gray-800 transition-colors hover:translate-y-1 rounded-md"
                                    >
                                        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" aria-hidden="true">
                                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                        </svg>
                                    </Link>
                                </div>
                            </div>

                            {/* Shadow Card removed as per request */}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
