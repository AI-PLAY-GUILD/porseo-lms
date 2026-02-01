import { Gamepad2, Bomb, Megaphone, Terminal, LineChart, Users } from "lucide-react";

const features = [
    {
        icon: Gamepad2,
        title: "まずは遊ぶ",
        description: "まずは手を動かして遊ぶことがモットー。自分のやりたいことを AIで実現し続け成長する。",
        color: "bg-pop-red"
    },
    {
        icon: Bomb,
        title: "失敗を称える",
        description: "エラーログは「挑戦の証」。みんなで讃え合えるような環境。",
        color: "bg-pop-yellow"
    },
    {
        icon: Megaphone,
        title: "世界へ発信",
        description: "運営者のXフォロワーは総計10万人以上。あなたの作ったものを社会へ公開。",
        color: "bg-pop-green"
    },
    {
        icon: Terminal,
        title: "実践的ハンズオン",
        description: "単なるツール紹介ではなく、創り、楽しむことに特化した実践的なライブハンズオンを週３回開催。",
        color: "bg-pop-purple"
    },
    {
        icon: LineChart,
        title: "専用学習システム",
        description: "学習ログを可視化。迷わず楽しみ続けられるよう、専用システムがサポート。",
        color: "bg-pop-red"
    },
    {
        icon: Users,
        title: "ギルドコミュニティ",
        description: "「勉強」は孤独ですが、「遊び」は伝染する。一緒に熱狂できる仲間を作ろう。",
        color: "bg-pop-yellow"
    }
];

export function BrutalistFeatures() {
    return (
        <section id="features" className="py-24 bg-white relative">
            <div className="container mx-auto px-4">
                <div className="text-center mb-20">
                    <h2 className="text-3xl sm:text-5xl md:text-7xl font-black mb-6 text-black uppercase tracking-tighter">
                        Why <span className="bg-pop-purple text-white px-4 transform -rotate-2 inline-block border-4 border-black">AI Play Guild?</span>
                    </h2>
                    <p className="text-lg sm:text-xl font-bold text-black max-w-2xl mx-auto">
                        AI時代を生き抜くための必須スキルと、<br />
                        一緒に成長できる仲間がここにいる。
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
