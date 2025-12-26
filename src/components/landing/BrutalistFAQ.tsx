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
        <section id="faq" className="py-16 bg-pop-green border-b-4 border-black relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '20px 20px' }}></div>

            <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-40 h-40 bg-pop-yellow rounded-full border-4 border-black brutal-shadow animate-blob hidden md:block"></div>
            <div className="absolute -right-10 bottom-10 w-32 h-32 bg-pop-purple rounded-none rotate-12 border-4 border-black brutal-shadow animate-blob animation-delay-2000 hidden md:block"></div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border-2 border-black text-black text-sm font-black tracking-widest uppercase mb-6 brutal-shadow-sm transform -rotate-2">
                            <HelpCircle className="w-4 h-4" />
                            Q & A
                        </div>
                        <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-black uppercase tracking-tighter leading-tight">
                            Frequently Asked <br />
                            <span className="text-white text-stroke-2">Questions</span>
                        </h2>
                    </div>

                    <div className="bg-white border-4 border-black rounded-2xl p-6 sm:p-8 brutal-shadow-lg">
                        <Accordion type="single" collapsible className="w-full space-y-4">
                            {faqs.map((faq, index) => (
                                <AccordionItem key={index} value={`item-${index}`} className="border-b-0">
                                    <AccordionTrigger className="text-left text-lg sm:text-xl font-black text-black hover:text-pop-purple hover:no-underline py-4 [&[data-state=open]]:text-pop-purple transition-colors">
                                        {faq.question}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-base sm:text-lg font-bold text-gray-600 leading-relaxed pb-4">
                                        {faq.answer}
                                    </AccordionContent>
                                    {index < faqs.length - 1 && (
                                        <div className="h-0.5 w-full bg-gray-200 my-2" />
                                    )}
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </div>
            </div>
        </section>
    );
}
