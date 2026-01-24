import Link from "next/link";

export function LandingFooter() {
    return (
        <footer className="py-12 border-t border-white/10 relative z-10 bg-black">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg">
                                AI
                            </div>
                            <span className="text-xl font-bold text-white">
                                AI Play Guild
                            </span>
                        </Link>
                        <p className="text-gray-400 max-w-sm">
                            AI技術を学び、実践し、未来を創造するコミュニティ。
                            初心者からプロフェッショナルまで、共に成長しましょう。
                        </p>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-6">Platform</h4>
                        <ul className="space-y-4">
                            <li><Link href="#features" className="text-gray-400 hover:text-white transition-colors">Features</Link></li>
                            <li><Link href="#pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link></li>
                            <li><Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">Dashboard</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-6">Legal</h4>
                        <ul className="space-y-4">
                            <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link></li>
                            <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                            <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-gray-500 text-sm">
                        © 2025 AI Play Guild. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        {/* Social Icons could go here */}
                    </div>
                </div>
            </div>
        </footer>
    );
}
