"use client";

import Link from "next/link";
import { StripeLinkModal } from "@/components/stripe-link-modal";

export function BrutalistFooter() {
    return (
        <footer className="py-12 border-t-4 border-black relative z-10 bg-black text-white">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-6 group">
                            <div className="w-10 h-10 bg-pop-yellow border-2 border-white flex items-center justify-center text-black font-black text-xl group-hover:rotate-12 transition-transform">
                                AI
                            </div>
                            <span className="text-2xl font-black text-white tracking-tighter">
                                AI PLAY GUILD
                            </span>
                        </Link>
                        <p className="text-gray-300 max-w-sm font-medium">
                            AIを遊び倒し、まだ見ぬ未来を切り拓く。
                        </p>
                    </div>

                    <div>
                        <h4 className="text-pop-yellow font-black mb-6 uppercase text-lg">Platform</h4>
                        <ul className="space-y-4 font-bold">
                            <li><Link href="#features" className="text-white hover:text-pop-red transition-colors">特徴</Link></li>
                            <li><Link href="#pricing" className="text-white hover:text-pop-red transition-colors">料金プラン</Link></li>
                            <li><Link href="/dashboard" className="text-white hover:text-pop-red transition-colors">ダッシュボード</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-pop-yellow font-black mb-6 uppercase text-lg">Legal</h4>
                        <ul className="space-y-4 font-bold">
                            <li><Link href="#" className="text-white hover:text-pop-red transition-colors">利用規約</Link></li>
                            <li><Link href="#" className="text-white hover:text-pop-red transition-colors">プライバシーポリシー</Link></li>
                            <li><Link href="#" className="text-white hover:text-pop-red transition-colors">お問い合わせ</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t-2 border-white/20 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-gray-400 text-sm font-bold">
                        © 2025 AI PLAY GUILD. ALL RIGHTS RESERVED.
                    </p>
                    <StripeLinkModal />
                </div>
            </div>
        </footer>
    );
}
