"use client";

import { Github, Twitter, Linkedin } from "lucide-react";
import Link from "next/link";

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
        imageUrl: "https://media.licdn.com/dms/image/v2/D4E03AQGC097StsvG5A/profile-displayphoto-scale_400_400/B4EZjHshs0HgAg-/0/1755696995772?e=1768435200&v=beta&t=NMlPGFiHNXfkSQ69AosFC0jD9SnalTWvYB6fqMvZxD8",
        twitterUrl: "https://x.com/porseo__ai"
    }
];

export function BrutalistTeam() {
    return (
        <section id="team" className="py-24 bg-background relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -z-10"></div>
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[100px] -z-10"></div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-20">
                    <h2 className="text-5xl md:text-6xl font-extrabold mb-6 text-foreground tracking-tight">
                        MEET THE <span className="text-gradient">CREW</span>
                    </h2>
                    <p className="text-xl font-medium text-muted-foreground max-w-2xl mx-auto">
                        あなたの熱狂を最大化するために集まった、<br />
                        3名の領域別運営陣。
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {team.map((member, index) => (
                        <div
                            key={index}
                            className="group relative"
                        >
                            {/* Card */}
                            <div className="bg-white rounded-3xl p-8 flex flex-col items-center text-center relative z-10 transition-all duration-300 hover:-translate-y-2 shadow-soft hover:shadow-lg border border-border/50 h-full">
                                {/* Avatar */}
                                <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-br from-primary to-accent mb-6 shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
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
                                <p className="text-muted-foreground font-medium leading-relaxed mb-8 flex-grow text-sm">
                                    {member.description}
                                </p>

                                {/* Social Links */}
                                <div className="flex gap-4 mt-auto">
                                    <Link href={member.twitterUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center hover:bg-black hover:text-white transition-all duration-300">
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
