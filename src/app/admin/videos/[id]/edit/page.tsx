"use client";

import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

import { BrutalistLoader } from "@/components/ui/brutalist-loader";

export default function EditVideoPage() {
    const params = useParams();
    const videoId = params.id as Id<"videos">;
    const router = useRouter();

    const video = useQuery(api.videos.getById, { videoId });
    const updateVideo = useMutation(api.videos.updateVideo);
    const generateUploadUrl = useMutation(api.videos.generateUploadUrl);
    const generateMetadata = useAction(api.ai.generateVideoMetadata);

    const userData = useQuery(api.users.getUser);
    const allTags = useQuery(api.tags.getTags);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [muxPlaybackId, setMuxPlaybackId] = useState("");
    const [isPublished, setIsPublished] = useState(false);
    const [muxAssetId, setMuxAssetId] = useState("");
    const [transcription, setTranscription] = useState("");
    const [summary, setSummary] = useState("");
    const [chapters, setChapters] = useState<{ title: string; startTime: number; description?: string }[]>([]);
    const [customThumbnailStorageId, setCustomThumbnailStorageId] = useState<Id<"_storage"> | undefined>(undefined);
    const [customThumbnailUrl, setCustomThumbnailUrl] = useState<string | null>(null);
    const [selectedTags, setSelectedTags] = useState<Id<"tags">[]>([]);
    const [createdAt, setCreatedAt] = useState<string>(""); // YYYY-MM-DD string for input
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isIndexing, setIsIndexing] = useState(false);

    useEffect(() => {
        if (userData !== undefined && !userData?.isAdmin) {
            router.push("/");
        }
    }, [userData, router]);

    useEffect(() => {
        if (video) {
            setTitle(video.title);
            setDescription(video.description || "");
            setIsPublished(video.isPublished);
            setMuxPlaybackId(video.muxPlaybackId || "");
            setMuxAssetId(video.muxAssetId || "");
            setTranscription(video.transcription || "");
            setSummary(video.summary || "");
            setChapters(video.chapters || []);
            setCustomThumbnailStorageId(video.customThumbnailStorageId);
            setCustomThumbnailUrl(video.thumbnailUrl || null);
            setSelectedTags(video.tags || []);
            // Convert timestamp to YYYY-MM-DD for input[type="date"]
            if (video.createdAt) {
                const date = new Date(video.createdAt);
                const yyyy = date.getFullYear();
                const mm = String(date.getMonth() + 1).padStart(2, '0');
                const dd = String(date.getDate()).padStart(2, '0');
                setCreatedAt(`${yyyy}-${mm}-${dd}`);
            }
        }
    }, [video]);

    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (!file) return;

        // 拡張子チェック (簡易)
        if (!file.name.endsWith('.vtt') && !file.name.endsWith('.txt')) {
            alert("対応しているファイル形式は .vtt または .txt です");
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result as string;
            setTranscription(text);
        };
        reader.readAsText(file);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await updateVideo({
                videoId,
                title,
                description,
                isPublished,
                muxPlaybackId,
                muxAssetId,
                customThumbnailStorageId,
                tags: selectedTags,
                transcription,
                summary,
                chapters,
                createdAt: createdAt ? new Date(createdAt).getTime() : undefined,
            });

            alert("更新しました！");
            router.push("/admin/videos");
        } catch (error) {
            console.error("Failed to update video:", error);
            alert("更新に失敗しました。");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (userData === undefined || video === undefined) return (
        <div className="flex items-center justify-center min-h-screen bg-cream">
            <BrutalistLoader />
        </div>
    );
    if (!userData?.isAdmin) return null;
    if (video === null) return <div className="p-8">動画が見つかりません</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-8">動画編集</h1>

            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium mb-1">タイトル</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-2 border rounded bg-white dark:bg-gray-900"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">説明</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-2 border rounded h-32 bg-white dark:bg-gray-900"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">作成日</label>
                    <input
                        type="date"
                        value={createdAt}
                        onChange={(e) => setCreatedAt(e.target.value)}
                        className="w-full p-2 border rounded bg-white dark:bg-gray-900"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        ※この日付は動画一覧の並び順に影響します。
                    </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                    <h3 className="font-bold text-yellow-600 dark:text-yellow-500 mb-2 text-sm">Mux設定（上級者向け）</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                        動画が再生できない場合やAI分析が失敗する場合は、ここのIDが間違っている可能性があります。<br />
                        Muxダッシュボードで &quot;Asset ID&quot; と &quot;Playback ID&quot; を確認してください。
                    </p>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Mux Asset ID</label>
                        <input
                            type="text"
                            value={muxAssetId}
                            onChange={(e) => setMuxAssetId(e.target.value)}
                            className="w-full p-2 border rounded bg-white dark:bg-gray-900 font-mono text-sm"
                            placeholder="Mux Asset ID"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Mux Playback ID</label>
                        <input
                            type="text"
                            value={muxPlaybackId}
                            onChange={(e) => setMuxPlaybackId(e.target.value)}
                            className="w-full p-2 border rounded bg-white dark:bg-gray-900 font-mono text-sm"
                            placeholder="Mux Playback ID"
                        />
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                    <h3 className="font-bold mb-2 text-sm">カスタムサムネイル</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                        Muxのデフォルトサムネイルの代わりに表示する画像をアップロードできます。
                    </p>

                    {customThumbnailUrl && (
                        <div className="mb-4">
                            <p className="text-xs text-gray-500 mb-1">現在のサムネイル:</p>
                            <img src={customThumbnailUrl} alt="Thumbnail" className="w-64 h-auto rounded border" />
                        </div>
                    )}

                    <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            try {
                                const postUrl = await generateUploadUrl();
                                const result = await fetch(postUrl, {
                                    method: "POST",
                                    headers: { "Content-Type": file.type },
                                    body: file,
                                });
                                const { storageId } = await result.json();
                                setCustomThumbnailStorageId(storageId);
                                alert("画像をアップロードしました（保存ボタンを押すと反映されます）");
                            } catch (error) {
                                console.error(error);
                                alert("アップロードに失敗しました");
                            }
                        }}
                        className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100"
                    />
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                    <h3 className="font-bold mb-2 text-sm">タグ設定</h3>
                    <div className="flex flex-wrap gap-2">
                        {allTags?.map((tag) => (
                            <button
                                key={tag._id}
                                type="button"
                                onClick={() => {
                                    if (selectedTags.includes(tag._id)) {
                                        setSelectedTags(selectedTags.filter(id => id !== tag._id));
                                    } else {
                                        setSelectedTags([...selectedTags, tag._id]);
                                    }
                                }}
                                className={`px-3 py-1 rounded-full text-sm border transition-colors ${selectedTags.includes(tag._id)
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                                    }`}
                            >
                                {tag.name}
                            </button>
                        ))}
                        {allTags?.length === 0 && <p className="text-sm text-gray-500">タグがありません。タグ管理画面で作成してください。</p>}
                    </div>
                </div>

                <Card
                    className={`p-6 transition-colors ${isDragging ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "bg-white dark:bg-gray-800"}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-sm flex items-center gap-2">
                            <span className="text-xl">📝</span> 文字起こし (AI分析・検索用)
                        </h3>
                        <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            .vtt / .txt ファイルをドロップ
                        </span>
                    </div>

                    <textarea
                        value={transcription}
                        onChange={(e) => setTranscription(e.target.value)}
                        className="w-full p-3 border rounded-lg h-64 font-mono text-sm bg-gray-50 dark:bg-gray-900 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="ここに文字起こしテキストを入力するか、ファイルをドロップしてください..."
                    />

                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-right">
                        {transcription.length} 文字
                    </p>
                </Card>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700 mb-8">
                    <h2 className="text-lg font-bold mb-4">✨ AI分析結果 (編集可能)</h2>

                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-1">AI要約</label>
                        <textarea
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            className="w-full p-3 border rounded-lg h-32 bg-gray-50 dark:bg-gray-900 dark:border-gray-700"
                            placeholder="AIによる要約がここに表示されます..."
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium">チャプター</label>
                            <button
                                type="button"
                                onClick={() => setChapters([...chapters, { title: "", startTime: 0, description: "" }])}
                                className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-300"
                            >
                                + 追加
                            </button>
                        </div>
                        <div className="space-y-3">
                            {chapters.map((chapter, index) => (
                                <div key={index} className="flex gap-2 items-start bg-gray-50 dark:bg-gray-900 p-3 rounded border dark:border-gray-700">
                                    <div className="w-20">
                                        <label className="text-xs text-gray-500 block">開始(秒)</label>
                                        <input
                                            type="number"
                                            value={chapter.startTime}
                                            onChange={(e) => {
                                                const newChapters = [...chapters];
                                                newChapters[index].startTime = Number(e.target.value);
                                                setChapters(newChapters);
                                            }}
                                            className="w-full p-1 border rounded text-sm"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs text-gray-500 block">タイトル</label>
                                        <input
                                            type="text"
                                            value={chapter.title}
                                            onChange={(e) => {
                                                const newChapters = [...chapters];
                                                newChapters[index].title = e.target.value;
                                                setChapters(newChapters);
                                            }}
                                            className="w-full p-1 border rounded text-sm mb-1"
                                            placeholder="タイトル"
                                        />
                                        <input
                                            type="text"
                                            value={chapter.description || ""}
                                            onChange={(e) => {
                                                const newChapters = [...chapters];
                                                newChapters[index].description = e.target.value;
                                                setChapters(newChapters);
                                            }}
                                            className="w-full p-1 border rounded text-xs text-gray-500"
                                            placeholder="説明（任意）"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newChapters = chapters.filter((_, i) => i !== index);
                                            setChapters(newChapters);
                                        }}
                                        className="text-red-500 hover:text-red-700 p-1"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                            {chapters.length === 0 && (
                                <p className="text-sm text-gray-400 text-center py-4">チャプターがありません</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isPublished"
                            checked={isPublished}
                            onChange={(e) => setIsPublished(e.target.checked)}
                            className="w-5 h-5"
                        />
                        <label htmlFor="isPublished" className="font-medium">公開する</label>
                    </div>
                </div>

                <div className="border-t pt-6 mt-2">
                    <h3 className="font-bold mb-2 flex items-center gap-2">
                        <span className="text-xl">✨</span> AI分析
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Geminiを使用して、動画の字幕から要約とチャプターを自動生成します。<br />
                        ※Mux側で字幕生成が完了している必要があります（アップロードから数分かかります）。
                    </p>
                    <button
                        type="button"
                        onClick={async () => {
                            // ローカルステートのIDを使用する（入力直後でも反映されるように）
                            if (!muxAssetId) {
                                alert("Mux Asset IDを入力してください");
                                return;
                            }
                            // 簡易バリデーション: Asset IDは通常長いため、極端に短い場合は警告
                            if (muxAssetId.length < 10) {
                                alert("Mux Asset IDが正しくないようです（短すぎます）。Muxダッシュボードで 'Asset ID' を確認してください。");
                                return;
                            }

                            if (!confirm("AI分析を開始しますか？（数秒〜数十秒かかります）")) return;

                            setIsAnalyzing(true);
                            try {
                                // まず動画情報を更新（保存）
                                await updateVideo({
                                    videoId,
                                    title,
                                    description,
                                    isPublished,
                                    muxPlaybackId,
                                    muxAssetId,
                                    transcription,
                                    summary,
                                    chapters,
                                });

                                // その後、AI分析を実行（入力された文字起こしを直接渡す）
                                const result = await generateMetadata({
                                    videoId: video._id,
                                    muxAssetId: muxAssetId,
                                    transcription: transcription, // 現在の入力値を渡す
                                });

                                // 結果を即座にフォームに反映
                                if (result) {
                                    setSummary(result.summary);
                                    setChapters(result.chapters);
                                }

                                alert("AI分析が完了しました！");
                            } catch (error: any) {
                                console.error(error);
                                alert(`エラーが発生しました: ${error.message} `);
                            } finally {
                                setIsAnalyzing(false);
                            }
                        }}
                        disabled={isAnalyzing}
                        className={`px-4 py-2 rounded-md transition-colors font-bold flex items-center gap-2 ${isAnalyzing
                            ? "bg-gray-400 cursor-not-allowed text-gray-200"
                            : "bg-purple-600 text-white hover:bg-purple-700"
                            }`}
                    >
                        {isAnalyzing ? (
                            <>
                                <span className="animate-spin text-xl">↻</span>
                                AI分析中...
                            </>
                        ) : (
                            "AI分析を実行する"
                        )}
                    </button>
                </div>



                <div className="flex gap-4 pt-4 border-t mt-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-4 py-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        キャンセル
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-bold"
                    >
                        更新する
                    </button>
                </div>
            </form>
        </div>
    );
}
