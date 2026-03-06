"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        console.error("[Global Error]", error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-cream px-4">
            <div className="text-center max-w-md">
                <h1 className="text-6xl font-black text-black mb-4">ERROR</h1>
                <div className="w-24 h-1 bg-red-500 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-black mb-4">エラーが発生しました</h2>
                <p className="text-gray-600 mb-8">予期しないエラーが発生しました。再度お試しください。</p>
                <div className="flex gap-4 justify-center">
                    <button
                        onClick={reset}
                        className="bg-black text-white font-bold px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        再試行
                    </button>
                    <a
                        href="/"
                        className="border-2 border-black text-black font-bold px-8 py-3 rounded-lg hover:bg-black hover:text-white transition-colors"
                    >
                        トップページ
                    </a>
                </div>
            </div>
        </div>
    );
}
