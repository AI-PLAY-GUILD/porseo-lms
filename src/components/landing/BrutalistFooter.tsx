"use client";

import Link from "next/link";
import { StripeLinkModal } from "@/components/stripe-link-modal";

export function BrutalistFooter() {
    return (
        <footer className="py-12 relative z-10 bg-white text-black">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-6 group">
                            <span className="text-2xl font-light text-slate-900 tracking-tight hover:opacity-70 transition-opacity font-[family-name:var(--font-jp)]">
                                AI PLAY GUILD
                            </span>
                        </Link>
                        <p className="text-slate-600 max-w-sm text-sm font-medium">
                            AIを遊び倒し、まだ見ぬ未来を切り拓く。
                        </p>
                    </div>

                    <div>
                        <h4 className="text-slate-900 font-medium mb-6 text-sm">プラットフォーム</h4>
                        <ul className="space-y-4">
                            <li>
                                <Link
                                    href="#features"
                                    className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                                >
                                    特徴
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="#pricing"
                                    className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                                >
                                    料金プラン
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/dashboard"
                                    className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                                >
                                    ダッシュボード
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-slate-900 font-medium mb-6 text-sm">法的情報</h4>
                        <ul className="space-y-4">
                            <li>
                                <Link
                                    href="#"
                                    className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                                >
                                    利用規約
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="#"
                                    className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                                >
                                    プライバシーポリシー
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="#"
                                    className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                                >
                                    お問い合わせ
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t-2 border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-slate-500 text-sm font-medium">© 2025 AI PLAY GUILD. ALL RIGHTS RESERVED.</p>
                    <StripeLinkModal />
                </div>
            </div>
        </footer>
    );
}
