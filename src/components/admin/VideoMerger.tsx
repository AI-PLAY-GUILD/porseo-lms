"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface MergeItem {
    videoId: Id<"videos"> | "";
    startTime: number;
    endTime: number;
    useRange: boolean;
}

export function VideoMerger() {
    const videos = useQuery(api.videos.getVideos);
    const createVideo = useMutation(api.videos.createVideo);

    const [items, setItems] = useState<MergeItem[]>([
        { videoId: "", startTime: 0, endTime: 0, useRange: false },
        { videoId: "", startTime: 0, endTime: 0, useRange: false },
    ]);
    const [mergeTitle, setMergeTitle] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<{ assetId: string; playbackId: string; status: string } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${String(s).padStart(2, "0")}`;
    };

    const updateItem = (index: number, updates: Partial<MergeItem>) => {
        setItems(items.map((item, i) => (i === index ? { ...item, ...updates } : item)));
    };

    const addItem = () => {
        setItems([...items, { videoId: "", startTime: 0, endTime: 0, useRange: false }]);
    };

    const removeItem = (index: number) => {
        if (items.length <= 2) return;
        setItems(items.filter((_, i) => i !== index));
    };

    const moveItem = (index: number, direction: "up" | "down") => {
        const newIndex = direction === "up" ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= items.length) return;
        const newItems = [...items];
        [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
        setItems(newItems);
    };

    const getVideoForItem = (item: MergeItem) => {
        return videos?.find((v) => v._id === item.videoId);
    };

    const handleMerge = async () => {
        const validItems = items.filter((item) => item.videoId);
        if (validItems.length < 2) {
            setError("2つ以上の動画を選択してください");
            return;
        }

        setIsProcessing(true);
        setError(null);
        setResult(null);

        try {
            const clips = validItems.map((item) => {
                const video = getVideoForItem(item);
                return {
                    assetId: video?.muxAssetId || "",
                    startTime: item.useRange ? item.startTime : 0,
                    endTime: item.useRange ? item.endTime : video?.duration || 0,
                };
            });

            const res = await fetch("/api/mux/clip", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode: "merge",
                    clips,
                    title: mergeTitle || "結合動画",
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "結合処理に失敗しました");
            }

            const data = await res.json();
            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "エラーが発生しました");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRegisterAsVideo = async () => {
        if (!result) return;
        try {
            await createVideo({
                title: mergeTitle || "結合動画",
                muxAssetId: result.assetId,
                muxPlaybackId: result.playbackId,
                duration: 0,
                requiredRoles: [],
                source: "manual",
            });
            alert("新しい動画として登録しました！");
        } catch (err) {
            alert(`登録に失敗しました: ${err instanceof Error ? err.message : "Unknown error"}`);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <label className="block text-sm font-bold">結合する動画</label>
                <button
                    type="button"
                    onClick={addItem}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-bold hover:bg-blue-700"
                >
                    + 動画を追加
                </button>
            </div>

            <div className="space-y-4">
                {items.map((item, index) => {
                    const video = getVideoForItem(item);
                    return (
                        <div key={index} className="p-4 bg-gray-50 border-2 border-black rounded-lg">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="bg-pop-purple text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">
                                    {index + 1}
                                </span>
                                <select
                                    value={item.videoId}
                                    onChange={(e) => updateItem(index, { videoId: e.target.value as Id<"videos"> })}
                                    className="flex-1 p-2 border rounded bg-white"
                                >
                                    <option value="">-- 動画を選択 --</option>
                                    {videos?.map((v) => (
                                        <option key={v._id} value={v._id}>
                                            {v.title} ({v.duration ? formatTime(v.duration) : "不明"})
                                        </option>
                                    ))}
                                </select>
                                <div className="flex gap-1">
                                    <button
                                        type="button"
                                        onClick={() => moveItem(index, "up")}
                                        disabled={index === 0}
                                        className="p-1 border rounded hover:bg-gray-200 disabled:opacity-30"
                                    >
                                        ↑
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => moveItem(index, "down")}
                                        disabled={index === items.length - 1}
                                        className="p-1 border rounded hover:bg-gray-200 disabled:opacity-30"
                                    >
                                        ↓
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => removeItem(index)}
                                        disabled={items.length <= 2}
                                        className="p-1 border rounded text-red-500 hover:bg-red-50 disabled:opacity-30"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>

                            {/* 範囲設定（オプション） */}
                            {item.videoId && (
                                <div className="ml-9">
                                    <label className="flex items-center gap-2 text-xs mb-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={item.useRange}
                                            onChange={(e) =>
                                                updateItem(index, {
                                                    useRange: e.target.checked,
                                                    endTime: e.target.checked ? video?.duration || 0 : 0,
                                                })
                                            }
                                        />
                                        <span className="font-medium">範囲を指定する</span>
                                    </label>
                                    {item.useRange && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">開始 (秒)</label>
                                                <input
                                                    type="number"
                                                    value={item.startTime}
                                                    onChange={(e) =>
                                                        updateItem(index, { startTime: Number(e.target.value) })
                                                    }
                                                    min={0}
                                                    step={0.1}
                                                    className="w-full p-1 border rounded text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">終了 (秒)</label>
                                                <input
                                                    type="number"
                                                    value={item.endTime}
                                                    onChange={(e) =>
                                                        updateItem(index, { endTime: Number(e.target.value) })
                                                    }
                                                    min={0}
                                                    step={0.1}
                                                    className="w-full p-1 border rounded text-sm"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* タイトル */}
            <div>
                <label className="block text-sm font-bold mb-2">結合後の動画タイトル</label>
                <input
                    type="text"
                    value={mergeTitle}
                    onChange={(e) => setMergeTitle(e.target.value)}
                    placeholder="結合動画"
                    className="w-full p-2 border-2 border-black rounded-lg"
                />
            </div>

            {/* 結合実行 */}
            <button
                type="button"
                onClick={handleMerge}
                disabled={isProcessing}
                className={`w-full py-3 rounded-lg font-bold text-white transition-colors ${
                    isProcessing
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-pop-purple hover:bg-purple-700 border-2 border-black brutal-shadow"
                }`}
            >
                {isProcessing ? "処理中..." : "結合を実行"}
            </button>

            {/* エラー表示 */}
            {error && <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg text-red-700">{error}</div>}

            {/* 結果表示 */}
            {result && (
                <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                    <h4 className="font-bold text-green-800 mb-2">結合完了</h4>
                    <div className="text-sm space-y-1 text-green-700">
                        <p>
                            Asset ID: <code className="bg-green-100 px-1 rounded">{result.assetId}</code>
                        </p>
                        <p>
                            Playback ID: <code className="bg-green-100 px-1 rounded">{result.playbackId}</code>
                        </p>
                        <p>ステータス: {result.status}</p>
                    </div>
                    <button
                        type="button"
                        onClick={handleRegisterAsVideo}
                        className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 border-2 border-black"
                    >
                        新しい動画として登録
                    </button>
                </div>
            )}
        </div>
    );
}
