import { Bot, Code, Globe, Users, Video, Zap } from "lucide-react";

const features = [
    {
        icon: Bot,
        title: "Latest AI Models",
        description: "GPT-4, Claude 3, Geminiなど、最新のAIモデルの活用方法をいち早くキャッチアップできます。",
    },
    {
        icon: Video,
        title: "Exclusive Content",
        description: "メンバー限定の動画講座やチュートリアルで、実践的なスキルを効率的に習得できます。",
    },
    {
        icon: Users,
        title: "Active Community",
        description: "同じ志を持つ仲間と交流し、知見を共有し合うことで、学習のモチベーションを維持できます。",
    },
    {
        icon: Code,
        title: "Hands-on Projects",
        description: "実際のプロジェクトを通じて、AIをアプリケーションに組み込む実践的な開発スキルを磨けます。",
    },
    {
        icon: Zap,
        title: "Prompt Engineering",
        description: "AIの可能性を最大限に引き出すための、高度なプロンプトエンジニアリング技術を学べます。",
    },
    {
        icon: Globe,
        title: "Global Trends",
        description: "海外のAIトレンドや最新ニュースを翻訳・要約して提供。情報のキャッチアップを加速させます。",
    },
];

export function LandingFeatures() {
    return (
        <section id="features" className="py-24 relative z-10">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        Why AI Play Guild?
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                        AI時代を生き抜くための必須スキルと、共に成長できる環境がここにあります。
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="group p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-1"
                        >
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <feature.icon className="w-6 h-6 text-blue-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                            <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
