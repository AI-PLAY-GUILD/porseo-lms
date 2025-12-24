import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function PlaygroundPage() {
    return (
        <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>

            {/* Floating Shapes */}
            <div className="absolute top-20 left-10 w-24 h-24 bg-pop-yellow rounded-full border-4 border-black brutal-shadow animate-blob animation-delay-2000 hidden md:block"></div>
            <div className="absolute bottom-40 right-10 w-32 h-32 bg-pop-purple rounded-none rotate-12 border-4 border-black brutal-shadow animate-blob hidden md:block"></div>

            <div className="max-w-4xl mx-auto text-center relative z-10">
                <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white border-2 border-black brutal-shadow-sm text-black font-bold mb-8 transform -rotate-2">
                    <Sparkles className="w-5 h-5 text-pop-yellow fill-pop-yellow" />
                    <span className="font-heading tracking-wide">WELCOME TO THE GUILD</span>
                </div>

                <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-8 text-black leading-[0.9]">
                    AI PLAY GUILD
                    <br />
                    <span className="text-pop-purple text-stroke-2 text-transparent">PLAYGROUND</span>
                </h1>

                <p className="text-xl md:text-2xl text-black font-bold max-w-2xl mx-auto mb-12 leading-relaxed">
                    さあ、AIの可能性を遊び尽くそう。
                </p>

                <Button asChild size="lg" className="h-20 px-12 text-2xl font-black rounded-xl bg-black text-white border-4 border-transparent hover:border-black hover:bg-pop-green hover:text-black hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all shadow-[8px_8px_0px_0px_#000000]">
                    <Link href="/dashboard">
                        GO TO DASHBOARD 🚀
                    </Link>
                </Button>
            </div>
        </div>
    );
}
