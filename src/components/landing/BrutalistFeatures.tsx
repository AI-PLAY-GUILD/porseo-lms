import { Gamepad2, Bomb, Megaphone, Terminal, LineChart, Users } from "lucide-react";

const features = [
    {
        icon: Gamepad2,
        title: "まずは遊ぶ",
        description: "まずは手を動かして遊ぶことがモットー。自分のやりたいことを AIで実現し続け成長する。",
        color: "text-primary"
    },
    {
        icon: Bomb,
        title: "失敗を称える",
        description: "エラーログは「挑戦の証」。みんなで讃え合えるような環境。",
        color: "text-accent"
    },
    {
        icon: Megaphone,
        title: "世界へ発信",
        description: "運営者のXフォロワーは総計10万人以上。あなたの作ったものを社会へ公開。",
        color: "text-primary"
    },
    {
        icon: Terminal,
        title: "実践的ハンズオン",
        description: "単なるツール紹介ではなく、創り、楽しむことに特化した実践的なライブハンズオンを週３回開催。",
        color: "text-accent"
    },
    {
        icon: LineChart,
        title: "専用学習システム",
        description: "学習ログを可視化。迷わず楽しみ続けられるよう、専用システムがサポート。",
        color: "text-primary"
    },
    {
        icon: Users,
        title: "ギルドコミュニティ",
        description: "「勉強」は孤独ですが、「遊び」は伝染する。一緒に熱狂できる仲間を作ろう。",
        color: "text-accent"
    }
];

export function BrutalistFeatures() {
    return (
        <section id="features" className="py-24 bg-muted/50 relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-20">
                    <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold mb-6 text-foreground tracking-tight">
                        Why <span className="text-gradient">AI Play Guild?</span>
                    </h2>
                    <p className="text-lg sm:text-xl font-medium text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        AI時代を生き抜くための必須スキルと、<br />
                        一緒に成長できる仲間がここにいる。
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="group p-8 rounded-2xl bg-white shadow-soft hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-border/50"
                        >
                            <div className={`w-14 h-14 rounded-2xl bg-secondary/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                <feature.icon className={`w-7 h-7 ${feature.color}`} />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-4">{feature.title}</h3>
                            <p className="text-muted-foreground font-medium leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
