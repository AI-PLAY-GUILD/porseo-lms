"use client";

import { useMutation, useQuery } from "convex/react";
import { useRef, useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export function VideoTrimmer() {
    const videos = useQuery(api.videos.getVideos);
    const createVideo = useMutation(api.videos.createVideo);

    const [selectedVideoId, setSelectedVideoId] = useState<Id<"videos"> | "">("");
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(0);
    const [newTitle, setNewTitle] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<{
        assetId: string;
        playbackId: string;
        status: string;
        duration?: number;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const playerRef = useRef<HTMLVideoElement>(null);

    const selectedVideo = videos?.find((v) => v._id === selectedVideoId);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return h > 0
            ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
            : `${m}:${String(s).padStart(2, "0")}`;
    };

    const handleSetCurrentTime = (target: "start" | "end") => {
        if (playerRef.current) {
            const time = Math.floor(playerRef.current.currentTime * 10) / 10;
            if (target === "start") setStartTime(time);
            else setEndTime(time);
        }
    };

    const handleTrim = async () => {
        if (!selectedVideo) return;
        if (startTime >= endTime) {
            setError("開始時間は終了時間より前である必要があります");
            return;
        }

        setIsProcessing(true);
        setError(null);
        setResult(null);

        try {
            const res = await fetch("/api/mux/clip", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode: "trim",
                    assetId: selectedVideo.muxAssetId,
                    startTime,
                    endTime,
                    title: newTitle || `${selectedVideo.title} (カット)`,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "カット処理に失敗しました");
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
        if (!result || !selectedVideo) return;
        try {
            await createVideo({
                title: newTitle || `${selectedVideo.title} (カット)`,
                muxAssetId: result.assetId,
                muxPlaybackId: result.playbackId,
                duration: result.duration || 0,
                requiredRoles: selectedVideo.requiredRoles || [],
                source: "manual",
            });
            alert("新しい動画として登録しました！");
        } catch (err) {
            alert(`登録に失敗しました: ${err instanceof Error ? err.message : "Unknown error"}`);
        }
    };

    return (
        <div className="space-y-6">
            {/* 動画選択 */}
            <div>
                <label className="block text-sm font-bold mb-2">動画を選択</label>
                <select
                    value={selectedVideoId}
                    onChange={(e) => {
                        setSelectedVideoId(e.target.value as Id<"videos">);
                        setResult(null);
                        setError(null);
                        setStartTime(0);
                        setEndTime(0);
                    }}
                    className="w-full p-2 border-2 border-black rounded-lg bg-white"
                >
                    <option value="">-- 動画を選択 --</option>
                    {videos?.map((v) => (
                        <option key={v._id} value={v._id}>
                            {v.title} ({v.duration ? formatTime(v.duration) : "不明"})
                        </option>
                    ))}
                </select>
            </div>

            {/* プレビュー */}
            {selectedVideo && selectedVideo.muxPlaybackId && (
                <div>
                    <label className="block text-sm font-bold mb-2">プレビュー</label>
                    <video
                        ref={playerRef}
                        src={`https://stream.mux.com/${selectedVideo.muxPlaybackId}.m3u8`}
                        controls
                        className="w-full rounded-lg border-2 border-black"
                        style={{ maxHeight: "400px" }}
                    >
                        <track kind="captions" />
                    </video>
                </div>
            )}

            {/* 範囲設定 */}
            {selectedVideo && (
                <div className="bg-gray-50 p-4 rounded-lg border-2 border-black">
                    <label className="block text-sm font-bold mb-3">カット範囲</label>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium mb-1">開始時間 (秒)</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={startTime}
                                    onChange={(e) => setStartTime(Number(e.target.value))}
                                    min={0}
                                    max={selectedVideo.duration || 9999}
                                    step={0.1}
                                    className="flex-1 p-2 border rounded"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleSetCurrentTime("start")}
                                    className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700"
                                >
                                    現在位置
                                </button>
                            </div>
                            <span className="text-xs text-gray-500">{formatTime(startTime)}</span>
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">終了時間 (秒)</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={endTime}
                                    onChange={(e) => setEndTime(Number(e.target.value))}
                                    min={0}
                                    max={selectedVideo.duration || 9999}
                                    step={0.1}
                                    className="flex-1 p-2 border rounded"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleSetCurrentTime("end")}
                                    className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700"
                                >
                                    現在位置
                                </button>
                            </div>
                            <span className="text-xs text-gray-500">{formatTime(endTime)}</span>
                        </div>
                    </div>

                    {/* レンジスライダー */}
                    {selectedVideo.duration && selectedVideo.duration > 0 && (
                        <div className="mt-4">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>0:00</span>
                                <span>{formatTime(selectedVideo.duration)}</span>
                            </div>
                            <div className="relative h-2 bg-gray-300 rounded">
                                <div
                                    className="absolute h-2 bg-blue-500 rounded"
                                    style={{
                                        left: `${(startTime / selectedVideo.duration) * 100}%`,
                                        width: `${((endTime - startTime) / selectedVideo.duration) * 100}%`,
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* タイトル */}
            {selectedVideo && (
                <div>
                    <label className="block text-sm font-bold mb-2">新しい動画のタイトル（任意）</label>
                    <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder={`${selectedVideo.title} (カット)`}
                        className="w-full p-2 border-2 border-black rounded-lg"
                    />
                </div>
            )}

            {/* カット実行ボタン */}
            {selectedVideo && (
                <button
                    type="button"
                    onClick={handleTrim}
                    disabled={isProcessing || !selectedVideo.muxAssetId}
                    className={`w-full py-3 rounded-lg font-bold text-white transition-colors ${
                        isProcessing
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-pop-purple hover:bg-purple-700 border-2 border-black brutal-shadow"
                    }`}
                >
                    {isProcessing ? "処理中..." : "カットを実行"}
                </button>
            )}

            {/* エラー表示 */}
            {error && <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg text-red-700">{error}</div>}

            {/* 結果表示 */}
            {result && (
                <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                    <h4 className="font-bold text-green-800 mb-2">カット完了</h4>
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
