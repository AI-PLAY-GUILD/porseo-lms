"use client";

import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface DevUser {
    label: string;
    description: string;
    email: string;
    password: string;
}

const DEV_USERS: DevUser[] = [
    {
        label: "テストユーザー（一般）",
        description: "通常の会員ユーザーとしてログイン",
        email: process.env.NEXT_PUBLIC_DEV_USER_EMAIL || "",
        password: process.env.NEXT_PUBLIC_DEV_USER_PASSWORD || "",
    },
    {
        label: "テスト管理者",
        description: "管理者権限でログイン",
        email: process.env.NEXT_PUBLIC_DEV_ADMIN_EMAIL || "",
        password: process.env.NEXT_PUBLIC_DEV_ADMIN_PASSWORD || "",
    },
];

export default function DevLoginPage() {
    const { signIn, setActive, isLoaded } = useSignIn();
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [customEmail, setCustomEmail] = useState("");
    const [customPassword, setCustomPassword] = useState("");

    // 本番環境では表示しない
    if (process.env.NODE_ENV !== "development") {
        router.replace("/login");
        return null;
    }

    const handleLogin = async (email: string, password: string, label: string) => {
        if (!isLoaded || !signIn || !setActive) return;
        if (!email || !password) {
            setError(
                "メールアドレスとパスワードを設定してください。.env.local の DEV_USER / DEV_ADMIN 環境変数を確認してください。",
            );
            return;
        }

        setLoading(label);
        setError(null);

        try {
            const result = await signIn.create({
                identifier: email,
                password: password,
            });

            if (result.status === "complete") {
                await setActive({ session: result.createdSessionId });
                router.push("/dashboard");
            } else {
                setError("ログインが完了しませんでした。Clerk Dashboardでアカウントを確認してください。");
            }
        } catch (err: unknown) {
            const clerkError = err as { errors?: { message: string }[] };
            setError(clerkError.errors?.[0]?.message || "ログインに失敗しました");
        } finally {
            setLoading(null);
        }
    };

    const hasConfiguredUsers = DEV_USERS.some((u) => u.email && u.password);

    return (
        <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-lg border-2 border-amber-400 p-8 max-w-md w-full">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-medium mb-3">
                        DEV ONLY
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">開発用ログイン</h1>
                    <p className="text-sm text-amber-600 mt-1">開発環境専用 — 本番では利用できません</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm border border-red-200">
                        {error}
                    </div>
                )}

                {/* プリセットユーザーボタン */}
                {hasConfiguredUsers && (
                    <div className="space-y-3 mb-6">
                        <h2 className="text-sm font-medium text-gray-700">ワンクリックログイン</h2>
                        {DEV_USERS.filter((u) => u.email && u.password).map((user) => (
                            <button
                                key={user.email}
                                onClick={() => handleLogin(user.email, user.password, user.label)}
                                disabled={!!loading}
                                className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="font-medium text-gray-900">{user.label}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{user.description}</div>
                                <div className="text-xs text-gray-400 mt-1 font-mono">{user.email}</div>
                                {loading === user.label && (
                                    <div className="text-xs text-blue-600 mt-1 animate-pulse">ログイン中...</div>
                                )}
                            </button>
                        ))}
                    </div>
                )}

                {/* カスタムログインフォーム */}
                <div className="space-y-3">
                    <h2 className="text-sm font-medium text-gray-700">
                        {hasConfiguredUsers ? "または手動入力" : "ログイン情報を入力"}
                    </h2>
                    <input
                        type="email"
                        placeholder="メールアドレス"
                        value={customEmail}
                        onChange={(e) => setCustomEmail(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                        type="password"
                        placeholder="パスワード"
                        value={customPassword}
                        onChange={(e) => setCustomPassword(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                        onClick={() => handleLogin(customEmail, customPassword, "カスタム")}
                        disabled={!!loading || !customEmail || !customPassword}
                        className="w-full py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading === "カスタム" ? "ログイン中..." : "ログイン"}
                    </button>
                </div>

                {/* セットアップガイド */}
                {!hasConfiguredUsers && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h3 className="text-sm font-medium text-blue-900 mb-2">セットアップ手順</h3>
                        <ol className="text-xs text-blue-800 space-y-1.5 list-decimal list-inside">
                            <li>Clerk Dashboardでテストユーザーを作成</li>
                            <li>
                                <code className="bg-blue-100 px-1 rounded">.env.local</code> に以下を追加：
                            </li>
                        </ol>
                        <pre className="mt-2 text-xs bg-blue-100 p-2 rounded overflow-x-auto text-blue-900">{`NEXT_PUBLIC_DEV_USER_EMAIL=test@example.com
NEXT_PUBLIC_DEV_USER_PASSWORD=your-password
NEXT_PUBLIC_DEV_ADMIN_EMAIL=admin@example.com
NEXT_PUBLIC_DEV_ADMIN_PASSWORD=your-password`}</pre>
                    </div>
                )}

                <div className="mt-6 pt-4 border-t text-center">
                    <a href="/login" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                        通常のログインページへ →
                    </a>
                </div>
            </div>
        </div>
    );
}
