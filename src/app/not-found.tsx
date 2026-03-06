import Link from "next/link";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-cream px-4">
            <div className="text-center max-w-md">
                <h1 className="text-8xl font-black text-black mb-4">404</h1>
                <div className="w-24 h-1 bg-black mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-black mb-4">ページが見つかりません</h2>
                <p className="text-gray-600 mb-8">お探しのページは存在しないか、移動した可能性があります。</p>
                <Link
                    href="/"
                    className="inline-block bg-black text-white font-bold px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors"
                >
                    トップページに戻る
                </Link>
            </div>
        </div>
    );
}
