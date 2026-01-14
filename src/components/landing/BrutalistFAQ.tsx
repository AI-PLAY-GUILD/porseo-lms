"use client";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

export function BrutalistFAQ() {
    const faqs = [
        {
            question: "初心者でも参加できますか？",
            answer: "もちろんです！AI Play Guildは「AIで何かを作ってみたい」という意欲がある方ならどなたでも歓迎します。基礎から実践まで学べるコンテンツを用意しています。"
        },
        {
            question: "解約はいつでもできますか？",
            answer: "はい、いつでもダッシュボードから解約可能です。契約期間の縛りはありません。"
        },
        {
            question: "Discordコミュニティでは何ができますか？",
            answer: "最新のAIニュースの共有、開発に関する質問・相談、そして同じ志を持つメンバー同士の交流が可能です。"
        },
        {
            question: "返金保証はありますか？",
            answer: "申し訳ありませんが、デジタルコンテンツの性質上、返金は受け付けておりません。まずは1ヶ月お試しいただければと思います。"
        }
    ];

    return (
        <section id="faq" className="py-24 bg-background relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0, 85, 255, 0.05) 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
            <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 -z-10"></div>
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] -z-10"></div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 backdrop-blur-sm border border-border text-foreground text-sm font-bold tracking-wide uppercase mb-6">
                            <HelpCircle className="w-4 h-4 text-primary" />
                            Q & A
                        </div>
                        <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-foreground tracking-tight leading-tight">
                            Frequently Asked <br />
                            <span className="text-gradient">Questions</span>
                        </h2>
                    </div>

                    <div className="bg-white/80 backdrop-blur-md border border-border/50 rounded-3xl p-6 sm:p-10 shadow-soft">
                        <Accordion type="single" collapsible className="w-full space-y-4">
                            {faqs.map((faq, index) => (
                                <AccordionItem key={index} value={`item-${index}`} className="border-b border-border/50 last:border-0">
                                    <AccordionTrigger className="text-left text-lg sm:text-xl font-bold text-foreground hover:text-primary hover:no-underline py-4 [&[data-state=open]]:text-primary transition-colors">
                                        {faq.question}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-base sm:text-lg font-medium text-muted-foreground leading-relaxed pb-4">
                                        {faq.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </div>
            </div>
        </section>
    );
}
