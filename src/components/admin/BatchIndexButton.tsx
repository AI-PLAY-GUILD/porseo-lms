"use client";

import { useAction } from "convex/react";
import { Database, Loader2 } from "lucide-react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";

export function BatchIndexButton() {
    const batchIndex = useAction(api.rag.batchIndexUnindexedVideos);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{
        total: number;
        indexed: number;
        failed: number;
        noTranscription: number;
        details: Array<{ videoId: string; title: string; status: string; chunks?: number }>;
    } | null>(null);
    const [mode, setMode] = useState<"idle" | "checked" | "done">("idle");

    const handleDryRun = async () => {
        setIsLoading(true);
        try {
            const res = await batchIndex({ dryRun: true });
            setResult(res);
            setMode("checked");
        } catch (error) {
            alert(`エラー: ${error}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleIndex = async () => {
        const needsIndexing = result?.details.filter((d) => d.status === "needs_indexing").length ?? 0;
        if (!confirm(`${needsIndexing}本の動画をベクトル化します。実行しますか？`)) return;

        setIsLoading(true);
        try {
            const res = await batchIndex({ dryRun: false });
            setResult(res);
            setMode("done");
        } catch (error) {
            alert(`エラー: ${error}`);
        } finally {
            setIsLoading(false);
        }
    };

    const needsIndexing = result?.details.filter((d) => d.status === "needs_indexing").length ?? 0;

    return (
        <div className="border rounded-lg p-4 bg-card space-y-3">
            <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-pop-purple" />
                <h3 className="font-bold text-sm">ベクトルインデックス管理</h3>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
                <button
                    onClick={handleDryRun}
                    disabled={isLoading}
                    className="text-sm font-bold px-3 py-1.5 rounded-lg border-2 border-black bg-white hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1.5"
                >
                    {isLoading && mode !== "done" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    状況確認
                </button>

                {mode === "checked" && needsIndexing > 0 && (
                    <button
                        onClick={handleIndex}
                        disabled={isLoading}
                        className="text-sm font-bold px-3 py-1.5 rounded-lg border-2 border-black bg-pop-yellow hover:bg-yellow-300 disabled:opacity-50 flex items-center gap-1.5"
                    >
                        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        {needsIndexing}本をベクトル化
                    </button>
                )}
            </div>

            {result && (
                <div className="text-xs space-y-1 text-muted-foreground">
                    <p>全動画: {result.total}本</p>
                    {mode === "checked" && (
                        <>
                            <p className="text-orange-600 font-bold">未インデックス: {needsIndexing}本</p>
                            <p>文字起こしなし: {result.noTranscription}本</p>
                        </>
                    )}
                    {mode === "done" && (
                        <>
                            <p className="text-green-600 font-bold">成功: {result.indexed}本</p>
                            {result.failed > 0 && <p className="text-red-600 font-bold">失敗: {result.failed}本</p>}
                            <p>文字起こしなし: {result.noTranscription}本</p>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
