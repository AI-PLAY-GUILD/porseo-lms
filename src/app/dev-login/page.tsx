"use client";

import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DevLoginPage() {
    const { signIn, setActive, isLoaded } = useSignIn();
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [debugLogs, setDebugLogs] = useState<string[]>([]);
    const [customEmail, setCustomEmail] = useState("");
    const [customPassword, setCustomPassword] = useState("");

    // 本番環境では表示しない
    if (process.env.NODE_ENV !== "development") {
        router.replace("/login");
        return null;
    }

    const log = (msg: string) => {
        console.log(`[dev-login] ${msg}`);
        setDebugLogs((prev) => [...prev, `${new Date().toLocaleTimeString()} ${msg}`]);
    };

    const handleLogin = async (email: string, password: string, label: string) => {
        if (!isLoaded || !signIn || !setActive) {
            log("Clerk未ロード - isLoaded:" + isLoaded);
            return;
        }

        setLoading(label);
        setError(null);
        log(`ログイン開始: ${email}`);

        try {
            const result = await signIn.create({
                identifier: email,
                password: password,
            });

            log(`signIn結果: status=${result.status}`);

            if (result.status === "complete") {
                await setActive({ session: result.createdSessionId });
                log("セッション設定完了、ダッシュボードへ遷移");
                router.push("/dashboard");
            } else {
                log(`予期しないstatus: ${result.status}`);
                setError(`ログイン未完了 (status: ${result.status})`);
            }
        } catch (err: unknown) {
            const clerkError = err as { errors?: { message: string; code?: string }[] };
            const msg = clerkError.errors?.map((e) => `${e.code}: ${e.message}`).join(", ") || "不明なエラー";
            log(`ログインエラー: ${msg}`);
            setError(msg);
        } finally {
            setLoading(null);
        }
    };

    const handleCreateAndLogin = async (role: "user" | "admin") => {
        if (!isLoaded || !signIn || !setActive) {
            log("Clerk未ロード");
            return;
        }

        const label = role === "admin" ? "管理者を作成中" : "ユーザーを作成中";
        setLoading(label);
        setError(null);
        log(`テストユーザー作成開始 (role: ${role})`);

        try {
            // 1. テストユーザーをClerkに自動作成
            log("API呼び出し: /api/dev/create-test-user");
            const res = await fetch("/api/dev/create-test-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role }),
            });

            log(`APIレスポンス: status=${res.status}`);

            const data = await res.json();
            log(`APIレスポンスbody: ${JSON.stringify(data)}`);

            if (!res.ok) {
                throw new Error(data.error || `API エラー (${res.status})`);
            }

            const { email, password } = data;
            log(`ユーザー作成成功: ${email}`);

            // 2. 作成したユーザーで自動ログイン
            log("Clerkサインイン開始...");
            const result = await signIn.create({
                identifier: email,
                password: password,
            });

            log(`signIn結果: status=${result.status}`);

            if (result.status === "complete") {
                await setActive({ session: result.createdSessionId });
                log("ログイン成功！ダッシュボードへ遷移");
                router.push("/dashboard");
            } else {
                log(`予期しないstatus: ${result.status}`);
                setError(`ログイン未完了 (status: ${result.status})`);
            }
        } catch (err: unknown) {
            const error = err as { errors?: { message: string; code?: string }[]; message?: string };
            const msg =
                error.errors?.map((e) => `${e.code}: ${e.message}`).join(", ") || error.message || "不明なエラー";
            log(`エラー: ${msg}`);
            setError(msg);
        } finally {
            setLoading(null);
        }
    };

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

                {/* ワンクリック: テストユーザー自動作成＆ログイン */}
                <div className="space-y-3 mb-6">
                    <h2 className="text-sm font-medium text-gray-700">ワンクリックでテスト開始</h2>
                    <p className="text-xs text-gray-500">
                        Clerkにテストアカウントを自動作成し、そのままログインします。
                    </p>

                    <button
                        onClick={() => handleCreateAndLogin("user")}
                        disabled={!!loading}
                        className="w-full p-4 rounded-xl border-2 border-green-200 hover:border-green-400 hover:bg-green-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="font-medium text-gray-900">テストユーザーを作成してログイン</div>
                        <div className="text-xs text-gray-500 mt-0.5">一般ユーザーとしてテスト</div>
                        {loading === "ユーザーを作成中" && (
                            <div className="text-xs text-green-600 mt-1 animate-pulse">作成＆ログイン中...</div>
                        )}
                    </button>

                    <button
                        onClick={() => handleCreateAndLogin("admin")}
                        disabled={!!loading}
                        className="w-full p-4 rounded-xl border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="font-medium text-gray-900">テスト管理者を作成してログイン</div>
                        <div className="text-xs text-gray-500 mt-0.5">管理者権限でテスト</div>
                        {loading === "管理者を作成中" && (
                            <div className="text-xs text-purple-600 mt-1 animate-pulse">作成＆ログイン中...</div>
                        )}
                    </button>
                </div>

                {/* 区切り線 */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                        <span className="bg-white px-3 text-gray-400">または既存アカウントで</span>
                    </div>
                </div>

                {/* 手動ログインフォーム */}
                <div className="space-y-3">
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

                {/* デバッグログ */}
                {debugLogs.length > 0 && (
                    <div className="mt-6 p-3 bg-gray-900 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-medium text-gray-400">Debug Log</h3>
                            <button
                                onClick={() => setDebugLogs([])}
                                className="text-xs text-gray-500 hover:text-gray-300"
                            >
                                clear
                            </button>
                        </div>
                        <div className="space-y-0.5 max-h-48 overflow-y-auto">
                            {debugLogs.map((log, i) => (
                                <div key={`${i}-${log}`} className="text-xs font-mono text-green-400">
                                    {log}
                                </div>
                            ))}
                        </div>
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
