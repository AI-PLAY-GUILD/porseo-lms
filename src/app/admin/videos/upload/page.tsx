"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import MuxUploader from "@mux/mux-uploader-react";

export default function VideoUploadPage() {
    const userData = useQuery(api.users.getUser);
    const createVideo = useMutation(api.videos.createVideo);
    const router = useRouter();

    const [isUploading, setIsUploading] = useState(false);
    const [isManualMode, setIsManualMode] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [videoTitle, setVideoTitle] = useState("");
    const [muxAssetId, setMuxAssetId] = useState("");
    const [muxPlaybackId, setMuxPlaybackId] = useState("");
    const [uploadUrl, setUploadUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (userData !== undefined && !userData?.isAdmin) {
            router.push("/");
        }
    }, [userData, router]);

    // コンポーネントマウント時にアップロードURLを取得（またはボタンで取得するように変更も可）
    // ここでは「アップロード準備」ボタンを押させるフローにする
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
            console.error("Error preparing upload:", err);
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
                requiredRoles: [], // 初期値は制限なし
            });
            alert("動画を登録しました！続けてアップロードできます。");

            // 状態をリセットして連続アップロード可能にする
            setUploadSuccess(false);
            setIsUploading(false);
            setVideoTitle("");
            setMuxAssetId("");
            setMuxPlaybackId("");
            setUploadUrl(null);
            setError(null);

        } catch (error) {
            console.error("Failed to create video:", error);
            alert("動画の登録に失敗しました。");
        }
    };

    if (userData === undefined) return <div className="p-8">読み込み中...</div>;
    if (!userData?.isAdmin) return null;

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">動画アップロード</h1>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm">
                {error && (
                    <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-md">
                        {error}
                    </div>
                )}

                <div className="flex justify-center mb-6">
                    <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-lg inline-flex">
                        <button
                            onClick={() => {
                                setIsManualMode(false);
                                setUploadSuccess(false);
                            }}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${!isManualMode
                                ? "bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                }`}
                        >
                            ファイルアップロード
                        </button>
                        <button
                            onClick={() => {
                                setIsManualMode(true);
                                setUploadSuccess(true); // 手動モードは即座にフォーム表示
                            }}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${isManualMode
                                ? "bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                }`}
                        >
                            Mux ID 手動入力
                        </button>
                    </div>
                </div>

                {!uploadSuccess && !isManualMode ? (
                    <>
                        {!uploadUrl ? (
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
                                    endpoint={uploadUrl} // ここに直接URLを渡す
                                    onUploadStart={() => setIsUploading(true)}
                                    onSuccess={handleUploadSuccess}
                                />
                            </>
                        )}
                    </>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {!isManualMode && (
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-md mb-4">
                                アップロードが完了しました！動画情報を入力してください。
                                <br />
                                <span className="text-sm text-red-500">
                                    ※注意: 現在の実装ではMuxのアセットIDを自動取得できないため、
                                    MuxダッシュボードからIDをコピーして貼り付ける必要があります。
                                </span>
                            </div>
                        )}

                        {isManualMode && (
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md mb-4">
                                Muxにアップロード済みの動画情報を入力してください。
                            </div>
                        )}

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
            </div>
        </div>
    );
}
