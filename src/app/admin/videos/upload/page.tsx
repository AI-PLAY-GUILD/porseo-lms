"use client";

import MuxUploader from "@mux/mux-uploader-react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "../../../../../convex/_generated/api";

type UploadMode = "file" | "manual" | "zoom" | "bulk";

interface ZoomRecordingFile {
    download_url: string;
    file_size?: number;
    recording_start?: string;
    recording_end?: string;
}

interface ZoomRecordingData {
    meetingId: string;
    topic: string;
    duration: number;
    recordings: {
        mp4: ZoomRecordingFile | null;
        vtt: ZoomRecordingFile | null;
        chat: ZoomRecordingFile | null;
    };
}

function formatFileSize(bytes: number): string {
    if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB`;
    if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
    return `${(bytes / 1_000).toFixed(1)} KB`;
}

function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}時間${m}分`;
    return `${m}分`;
}

export default function VideoUploadPage() {
    const userData = useQuery(api.users.getUser);
    const createVideo = useMutation(api.videos.createVideo);
    const router = useRouter();

    // Common state
    const [mode, setMode] = useState<UploadMode>("file");
    const [error, setError] = useState<string | null>(null);

    // File upload state
    const [_isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [videoTitle, setVideoTitle] = useState("");
    const [muxAssetId, setMuxAssetId] = useState("");
    const [muxPlaybackId, setMuxPlaybackId] = useState("");
    const [uploadUrl, setUploadUrl] = useState<string | null>(null);

    // Zoom state
    const [zoomInput, setZoomInput] = useState("");
    const [zoomRecordings, setZoomRecordings] = useState<ZoomRecordingData | null>(null);
    const [zoomLoading, setZoomLoading] = useState(false);
    const [zoomImporting, setZoomImporting] = useState(false);
    const [zoomSuccess, setZoomSuccess] = useState(false);

    // Bulk import state
    const [bulkLoading, setBulkLoading] = useState(false);
    const [bulkResults, setBulkResults] = useState<{
        fromDate: string;
        toDate: string;
        totalFound: number;
        imported: number;
        skipped: number;
        errors: number;
        results: { meetingId: string; topic: string; status: string; reason?: string }[];
    } | null>(null);

    useEffect(() => {
        if (userData !== undefined && !userData?.isAdmin) {
            router.push("/");
        }
    }, [userData, router]);

    const handleModeChange = (newMode: UploadMode) => {
        setMode(newMode);
        setError(null);
        if (newMode === "manual") {
            setUploadSuccess(true);
        } else if (newMode === "file") {
            setUploadSuccess(false);
        }
    };

    // ===== File Upload =====
    const prepareUpload = async () => {
        try {
            setError(null);
            const response = await fetch("/api/mux/upload", { method: "POST" });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || "Failed to get upload URL");
            }
            const data = await response.json();
            setUploadUrl(data.url);
        } catch (err) {
            setError(err instanceof Error ? err.message : "アップロードの準備に失敗しました");
        }
    };

    const handleUploadSuccess = (_event: unknown) => {
        setUploadSuccess(true);
        setIsUploading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!muxAssetId || !muxPlaybackId) {
            alert("動画の処理待ち、またはエラーです。Muxのダッシュボードを確認してください。");
            return;
        }

        try {
            await createVideo({
                title: videoTitle,
                muxAssetId,
                muxPlaybackId,
                requiredRoles: [],
            });
            alert("動画を登録しました！続けてアップロードできます。");
            setUploadSuccess(false);
            setIsUploading(false);
            setVideoTitle("");
            setMuxAssetId("");
            setMuxPlaybackId("");
            setUploadUrl(null);
            setError(null);
        } catch {
            alert("動画の登録に失敗しました。");
        }
    };

    // ===== Zoom =====
    const handleZoomSearch = async () => {
        if (!zoomInput.trim()) return;
        setZoomLoading(true);
        setError(null);
        setZoomRecordings(null);
        setZoomSuccess(false);
        try {
            const res = await fetch("/api/zoom/recordings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ input: zoomInput.trim() }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "録画の取得に失敗しました");
            }
            setZoomRecordings(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "エラーが発生しました");
        } finally {
            setZoomLoading(false);
        }
    };

    const handleZoomImport = async () => {
        if (!zoomRecordings) return;
        setZoomImporting(true);
        setError(null);
        try {
            const res = await fetch("/api/zoom/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    meetingId: zoomRecordings.meetingId,
                    topic: zoomRecordings.topic,
                    mp4DownloadUrl: zoomRecordings.recordings.mp4?.download_url,
                    vttDownloadUrl: zoomRecordings.recordings.vtt?.download_url || "",
                    chatDownloadUrl: zoomRecordings.recordings.chat?.download_url || "",
                    duration: zoomRecordings.duration,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "取り込みに失敗しました");
            }
            setZoomSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "エラーが発生しました");
        } finally {
            setZoomImporting(false);
        }
    };

    const handleZoomReset = () => {
        setZoomInput("");
        setZoomRecordings(null);
        setZoomSuccess(false);
        setError(null);
    };

    // ===== Bulk Import =====
    const handleBulkImport = async () => {
        setBulkLoading(true);
        setError(null);
        setBulkResults(null);
        try {
            const res = await fetch("/api/zoom/bulk-import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "一括取り込みに失敗しました");
            }
            setBulkResults(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "エラーが発生しました");
        } finally {
            setBulkLoading(false);
        }
    };

    if (userData === undefined) return <div className="p-8">読み込み中...</div>;
    if (!userData?.isAdmin) return null;

    const tabClass = (tabMode: UploadMode) =>
        `px-4 py-2 rounded-md text-sm font-medium transition-all ${
            mode === tabMode
                ? "bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        }`;

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">動画アップロード</h1>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm">
                {error && <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-md">{error}</div>}

                {/* Tab Switcher */}
                <div className="flex justify-center mb-6">
                    <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-lg inline-flex">
                        <button onClick={() => handleModeChange("file")} className={tabClass("file")}>
                            ファイルアップロード
                        </button>
                        <button onClick={() => handleModeChange("manual")} className={tabClass("manual")}>
                            Mux ID 手動入力
                        </button>
                        <button onClick={() => handleModeChange("zoom")} className={tabClass("zoom")}>
                            Zoom録画取得
                        </button>
                        <button onClick={() => handleModeChange("bulk")} className={tabClass("bulk")}>
                            一括取込
                        </button>
                    </div>
                </div>

                {/* ===== File Upload Tab ===== */}
                {mode === "file" && (
                    <>
                        {!uploadSuccess ? (
                            !uploadUrl ? (
                                <div className="text-center py-8">
                                    <p className="mb-4 text-gray-600 dark:text-gray-300">
                                        新しい動画をアップロードするためのURLを発行します。
                                    </p>
                                    <button
                                        onClick={prepareUpload}
                                        className="bg-blue-600 text-white px-6 py-3 rounded-full font-bold hover:bg-blue-700 transition-colors"
                                    >
                                        アップロードを開始する
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <p className="mb-4 text-gray-600 dark:text-gray-300">
                                        動画ファイルを選択してください。
                                    </p>
                                    <MuxUploader
                                        endpoint={uploadUrl}
                                        onUploadStart={() => setIsUploading(true)}
                                        onSuccess={handleUploadSuccess}
                                    />
                                </>
                            )
                        ) : (
                            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-md mb-4">
                                    アップロードが完了しました！動画情報を入力してください。
                                    <br />
                                    <span className="text-sm text-red-500">
                                        ※注意: 現在の実装ではMuxのアセットIDを自動取得できないため、
                                        MuxダッシュボードからIDをコピーして貼り付ける必要があります。
                                    </span>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">タイトル</label>
                                    <input
                                        type="text"
                                        value={videoTitle}
                                        onChange={(e) => setVideoTitle(e.target.value)}
                                        className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Mux Asset ID</label>
                                    <input
                                        type="text"
                                        value={muxAssetId}
                                        onChange={(e) => setMuxAssetId(e.target.value)}
                                        className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                        placeholder="Muxダッシュボードからコピー"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Mux Playback ID</label>
                                    <input
                                        type="text"
                                        value={muxPlaybackId}
                                        onChange={(e) => setMuxPlaybackId(e.target.value)}
                                        className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                        placeholder="Muxダッシュボードからコピー"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    登録する
                                </button>
                            </form>
                        )}
                    </>
                )}

                {/* ===== Manual Mode Tab ===== */}
                {mode === "manual" && (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md mb-4">
                            Muxにアップロード済みの動画情報を入力してください。
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">タイトル</label>
                            <input
                                type="text"
                                value={videoTitle}
                                onChange={(e) => setVideoTitle(e.target.value)}
                                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Mux Asset ID</label>
                            <input
                                type="text"
                                value={muxAssetId}
                                onChange={(e) => setMuxAssetId(e.target.value)}
                                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                placeholder="Muxダッシュボードからコピー"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Mux Playback ID</label>
                            <input
                                type="text"
                                value={muxPlaybackId}
                                onChange={(e) => setMuxPlaybackId(e.target.value)}
                                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                placeholder="Muxダッシュボードからコピー"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                        >
                            登録する
                        </button>
                    </form>
                )}

                {/* ===== Zoom Tab ===== */}
                {mode === "zoom" && (
                    <div className="flex flex-col gap-4">
                        {zoomSuccess ? (
                            <div className="text-center py-8">
                                <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-md">
                                    <p className="font-bold mb-1">取り込みを開始しました！</p>
                                    <p className="text-sm">
                                        バックグラウンドでMuxへの動画取り込みと文字起こしの処理が行われます。
                                        動画一覧ページで処理状況を確認できます。
                                    </p>
                                </div>
                                <button
                                    onClick={handleZoomReset}
                                    className="bg-blue-600 text-white px-6 py-3 rounded-full font-bold hover:bg-blue-700 transition-colors"
                                >
                                    別の録画を取り込む
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-md">
                                    <p className="font-medium mb-1">ZoomミーティングIDを入力してください。</p>
                                    <p className="text-sm">
                                        クラウドレコーディングされた録画を取得し、非公開として登録します。
                                        文字起こし・チャットメッセージも自動で取得されます。
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        ミーティングID または ミーティングURL
                                    </label>
                                    <input
                                        type="text"
                                        value={zoomInput}
                                        onChange={(e) => setZoomInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                                                e.preventDefault();
                                                handleZoomSearch();
                                            }
                                        }}
                                        className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                        placeholder="例: 12345678901 または https://zoom.us/j/12345678901"
                                    />
                                </div>

                                <button
                                    onClick={handleZoomSearch}
                                    disabled={zoomLoading || !zoomInput.trim()}
                                    className="bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {zoomLoading ? "検索中..." : "録画を検索"}
                                </button>

                                {/* Search Results */}
                                {zoomRecordings && (
                                    <div className="border-t pt-4 mt-2">
                                        <h3 className="font-bold text-lg mb-3">検索結果</h3>
                                        <div className="space-y-2 mb-4">
                                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                                                <span className="text-sm font-medium">トピック</span>
                                                <span className="text-sm">{zoomRecordings.topic}</span>
                                            </div>
                                            {zoomRecordings.duration > 0 && (
                                                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                                                    <span className="text-sm font-medium">録画時間</span>
                                                    <span className="text-sm">
                                                        {formatDuration(zoomRecordings.duration)}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                                                <span className="text-sm font-medium">MP4 録画</span>
                                                <span className="text-sm text-green-600 font-bold">
                                                    {zoomRecordings.recordings.mp4?.file_size
                                                        ? formatFileSize(zoomRecordings.recordings.mp4.file_size)
                                                        : "あり"}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                                                <span className="text-sm font-medium">文字起こし</span>
                                                <span
                                                    className={`text-sm font-bold ${zoomRecordings.recordings.vtt ? "text-green-600" : "text-gray-400"}`}
                                                >
                                                    {zoomRecordings.recordings.vtt ? "あり" : "なし"}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                                                <span className="text-sm font-medium">チャット</span>
                                                <span
                                                    className={`text-sm font-bold ${zoomRecordings.recordings.chat ? "text-green-600" : "text-gray-400"}`}
                                                >
                                                    {zoomRecordings.recordings.chat ? "あり" : "なし"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-md text-sm mb-4">
                                            この動画は「非公開」タグ付きで登録されます。公開は動画編集ページから行えます。
                                        </div>

                                        <button
                                            onClick={handleZoomImport}
                                            disabled={zoomImporting}
                                            className="w-full bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {zoomImporting ? "取り込み中..." : "取り込みを開始する"}
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* ===== Bulk Import Tab ===== */}
                {mode === "bulk" && (
                    <div className="flex flex-col gap-4">
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-md">
                            <p className="font-medium mb-1">Zoom録画の一括取り込み</p>
                            <p className="text-sm">
                                アプリに最後に登録されたZoom録画以降の、すべてのクラウドレコーディングを自動で取り込みます。
                                文字起こし・チャットメッセージも自動で取得されます。
                            </p>
                        </div>

                        {!bulkResults ? (
                            <button
                                onClick={handleBulkImport}
                                disabled={bulkLoading}
                                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {bulkLoading ? "取り込み中... (しばらくお待ちください)" : "一括取り込みを開始する"}
                            </button>
                        ) : (
                            <div className="space-y-4">
                                {/* Summary */}
                                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md space-y-2">
                                    <p className="text-sm">
                                        <span className="font-medium">対象期間:</span> {bulkResults.fromDate} 〜{" "}
                                        {bulkResults.toDate}
                                    </p>
                                    <p className="text-sm">
                                        <span className="font-medium">検出数:</span> {bulkResults.totalFound}件
                                    </p>
                                    <div className="flex gap-4 text-sm">
                                        <span className="text-green-600 font-bold">取込: {bulkResults.imported}件</span>
                                        <span className="text-gray-500">スキップ: {bulkResults.skipped}件</span>
                                        {bulkResults.errors > 0 && (
                                            <span className="text-red-600 font-bold">
                                                エラー: {bulkResults.errors}件
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Details */}
                                {bulkResults.results.length > 0 && (
                                    <div className="border rounded-md overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-100 dark:bg-gray-700">
                                                <tr>
                                                    <th className="py-2 px-3 text-left">トピック</th>
                                                    <th className="py-2 px-3 text-left">状態</th>
                                                    <th className="py-2 px-3 text-left">備考</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {bulkResults.results.map((r, i) => (
                                                    <tr
                                                        key={`${r.meetingId}-${i}`}
                                                        className="border-t dark:border-gray-600"
                                                    >
                                                        <td className="py-2 px-3">{r.topic}</td>
                                                        <td className="py-2 px-3">
                                                            <span
                                                                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                                                    r.status === "imported"
                                                                        ? "bg-green-100 text-green-800"
                                                                        : r.status === "error"
                                                                          ? "bg-red-100 text-red-800"
                                                                          : "bg-gray-100 text-gray-600"
                                                                }`}
                                                            >
                                                                {r.status === "imported"
                                                                    ? "取込済"
                                                                    : r.status === "error"
                                                                      ? "エラー"
                                                                      : "スキップ"}
                                                            </span>
                                                        </td>
                                                        <td className="py-2 px-3 text-gray-500">{r.reason || "-"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                <button
                                    onClick={() => setBulkResults(null)}
                                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors font-medium"
                                >
                                    もう一度実行する
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
