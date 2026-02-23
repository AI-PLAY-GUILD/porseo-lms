"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function BrutalistFAQ() {
    const faqs = [
        {
            question: "初心者でも参加できますか？",
            answer: "もちろんです！AI Play Guildは「AIで何かを作ってみたい」という意欲がある方ならどなたでも歓迎します。基礎から実践まで学べるコンテンツを用意しています。",
        },
        {
            question: "解約はいつでもできますか？",
            answer: "はい、いつでもダッシュボードから解約可能です。契約期間の縛りはありません。",
        },
        {
            question: (
                <span>
                    <span style={{ fontFamily: "Arial, sans-serif" }}>Discord</span>コミュニティでは何ができますか？
                </span>
            ),
            answer: "最新のAIニュースの共有、開発に関する質問・相談、そして同じ志を持つメンバー同士の交流が可能です。",
        },
        {
            question: "返金保証はありますか？",
            answer: "申し訳ありませんが、デジタルコンテンツの性質上、返金は受け付けておりません。まずは1ヶ月お試しいただければと思います。",
        },
    ];

    return (
        <section id="faq" className="py-16 md:py-24 bg-white relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-12">
                        <h2
                            className="text-3xl sm:text-4xl md:text-6xl font-black text-black tracking-tighter leading-tight"
                            style={{ fontFamily: "var(--font-jp)" }}
                        >
                            よくある質問
                        </h2>
                    </div>

                    <div className="bg-white border-4 border-black p-6 sm:p-8 rounded-lg">
                        <Accordion type="single" collapsible className="w-full space-y-4">
                            {faqs.map((faq, index) => (
                                <AccordionItem key={index} value={`item-${index}`} className="border-b-0">
                                    <AccordionTrigger className="text-left text-lg sm:text-xl font-black text-black hover:opacity-70 hover:no-underline py-4 transition-opacity">
                                        {faq.question}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-base sm:text-lg font-bold text-gray-600 leading-relaxed pb-4">
                                        {faq.answer}
                                    </AccordionContent>
                                    {index < faqs.length - 1 && <div className="h-0.5 w-full bg-gray-200 my-2" />}
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </div>
            </div>
        </section>
    );
}
