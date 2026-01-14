"use client";

import Link from "next/link";
import { StripeLinkModal } from "@/components/stripe-link-modal";

export function BrutalistFooter() {
    return (
        <footer className="py-16 border-t border-border/50 relative z-10 bg-background text-foreground">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-6 group">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
                                AI
                            </div>
                            <span className="text-2xl font-extrabold text-foreground tracking-tight">
                                AI PLAY GUILD
                            </span>
                        </Link>
                        <p className="text-muted-foreground max-w-sm font-medium leading-relaxed">
                            AIを遊び倒し、まだ見ぬ未来を切り拓く。
                        </p>
                    </div>

                    <div>
                        <h4 className="text-foreground font-bold mb-6 uppercase text-sm tracking-wider">Platform</h4>
                        <ul className="space-y-4 font-medium text-muted-foreground">
                            <li><Link href="#features" className="hover:text-primary transition-colors">特徴</Link></li>
                            <li><Link href="#pricing" className="hover:text-primary transition-colors">料金プラン</Link></li>
                            <li><Link href="/dashboard" className="hover:text-primary transition-colors">ダッシュボード</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-foreground font-bold mb-6 uppercase text-sm tracking-wider">Legal</h4>
                        <ul className="space-y-4 font-medium text-muted-foreground">
                            <li><Link href="#" className="hover:text-primary transition-colors">利用規約</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">プライバシーポリシー</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">お問い合わせ</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-muted-foreground text-sm font-medium">
                        © 2025 AI PLAY GUILD. ALL RIGHTS RESERVED.
                    </p>
                    <StripeLinkModal />
                </div>
            </div>
        </footer>
    );
}
