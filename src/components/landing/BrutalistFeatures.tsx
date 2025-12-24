import { Bot, Zap, Users, Code, Video, Globe } from "lucide-react";

const features = [
    {
        icon: Bot,
        title: "Latest AI Models",
        description: "GPT-4, Claude 3, Geminiなど、最新モデルを遊び倒せ！",
        color: "bg-pop-red"
    },
    {
        icon: Video,
        title: "Exclusive Content",
        description: "メンバー限定の動画講座で、爆速スキルアップ。",
        color: "bg-pop-yellow"
    },
    {
        icon: Users,
        title: "Active Community",
        description: "同じ志を持つ仲間と、熱く語り合おう。",
        color: "bg-pop-green"
    },
    {
        icon: Code,
        title: "Hands-on Projects",
        description: "実践的なプロジェクトで、手を動かして学べ。",
        color: "bg-pop-purple"
    },
    {
        icon: Zap,
        title: "Prompt Engineering",
        description: "AIを自在に操る、魔法のようなプロンプト術。",
        color: "bg-pop-red"
    },
    {
        icon: Globe,
        title: "Global Trends",
        description: "世界の最新トレンドを、いち早くキャッチ。",
        color: "bg-pop-yellow"
    }
];

export function BrutalistFeatures() {
    return (
        <section id="features" className="py-24 bg-white border-b-4 border-black relative">
            <div className="container mx-auto px-4">
                <div className="text-center mb-20">
                    <h2 className="text-5xl md:text-7xl font-black mb-6 text-black uppercase tracking-tighter">
                        Why <span className="bg-pop-purple text-white px-4 transform -rotate-2 inline-block border-4 border-black">AI Play Guild?</span>
                    </h2>
                    <p className="text-xl font-bold text-black max-w-2xl mx-auto">
                        AI時代を生き抜くための必須スキルと、<br />
                        最高にクレイジーな仲間がここにいる。
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="group p-8 rounded-xl bg-cream border-4 border-black brutal-shadow hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all duration-200"
                        >
                            <div className={`w-16 h-16 rounded-xl ${feature.color} border-4 border-black flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform duration-200`}>
                                <feature.icon className="w-8 h-8 text-black" />
                            </div>
                            <h3 className="text-2xl font-black text-black mb-4 uppercase">{feature.title}</h3>
                            <p className="text-black font-medium leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
