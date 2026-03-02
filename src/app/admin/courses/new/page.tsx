"use client";

import { useMutation, useQuery } from "convex/react";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BrutalistLoader } from "@/components/ui/brutalist-loader";
import { Button } from "@/components/ui/button";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

export default function NewCoursePage() {
    const userData = useQuery(api.users.getUser);
    const videos = useQuery(api.videos.getVideos);
    const createCourse = useMutation(api.courses.createCourse);
    const router = useRouter();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [isPublished, setIsPublished] = useState(false);
    const [selectedVideoIds, setSelectedVideoIds] = useState<Id<"videos">[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (userData !== undefined && !userData?.isAdmin) {
            router.push("/");
        }
    }, [userData, router]);

    if (userData === undefined || videos === undefined) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-cream">
                <BrutalistLoader />
            </div>
        );
    }

    if (!userData?.isAdmin) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            alert("タイトルを入力してください");
            return;
        }
        setIsSubmitting(true);
        try {
            await createCourse({
                title,
                description: description || undefined,
                videoIds: selectedVideoIds,
                isPublished,
            });
            alert("コースを作成しました！");
            router.push("/admin/courses");
        } catch (error) {
            const msg = error instanceof Error ? error.message : "不明なエラー";
            alert(`エラー: ${msg}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleVideo = (videoId: Id<"videos">) => {
        if (selectedVideoIds.includes(videoId)) {
            setSelectedVideoIds(selectedVideoIds.filter((id) => id !== videoId));
        } else {
            setSelectedVideoIds([...selectedVideoIds, videoId]);
        }
    };

    const moveVideo = (index: number, direction: "up" | "down") => {
        const newIds = [...selectedVideoIds];
        const swapIndex = direction === "up" ? index - 1 : index + 1;
        if (swapIndex < 0 || swapIndex >= newIds.length) return;
        [newIds[index], newIds[swapIndex]] = [newIds[swapIndex], newIds[index]];
        setSelectedVideoIds(newIds);
    };

    const removeVideo = (videoId: Id<"videos">) => {
        setSelectedVideoIds(selectedVideoIds.filter((id) => id !== videoId));
    };

    const videoMap = new Map(videos.map((v) => [v._id, v]));

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-8">コース作成</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium mb-1">タイトル</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-2 border rounded bg-white dark:bg-gray-900"
                        placeholder="例: プログラミング入門コース"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">説明</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-2 border rounded h-32 bg-white dark:bg-gray-900"
                        placeholder="コースの説明を入力..."
                    />
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="isPublished"
                        checked={isPublished}
                        onChange={(e) => setIsPublished(e.target.checked)}
                        className="w-5 h-5"
                    />
                    <label htmlFor="isPublished" className="font-medium">
                        公開する
                    </label>
                </div>

                {/* 選択済み動画（並び替え可能） */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border">
                    <h3 className="font-bold mb-3">選択済み動画（{selectedVideoIds.length}本）</h3>
                    {selectedVideoIds.length === 0 ? (
                        <p className="text-sm text-gray-500">下の一覧から動画を選択してください。</p>
                    ) : (
                        <div className="space-y-2">
                            {selectedVideoIds.map((videoId, index) => {
                                const video = videoMap.get(videoId);
                                if (!video) return null;
                                return (
                                    <div
                                        key={videoId}
                                        className="flex items-center gap-2 p-2 bg-white dark:bg-gray-900 rounded border"
                                    >
                                        <span className="text-sm font-mono text-gray-400 w-6 text-center">
                                            {index + 1}
                                        </span>
                                        <span className="flex-1 text-sm font-medium truncate">{video.title}</span>
                                        <button
                                            type="button"
                                            onClick={() => moveVideo(index, "up")}
                                            disabled={index === 0}
                                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30"
                                        >
                                            <ArrowUp className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => moveVideo(index, "down")}
                                            disabled={index === selectedVideoIds.length - 1}
                                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30"
                                        >
                                            <ArrowDown className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => removeVideo(videoId)}
                                            className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-500"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 全動画一覧（チェックボックス） */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border">
                    <h3 className="font-bold mb-3">動画一覧</h3>
                    <div className="max-h-96 overflow-y-auto space-y-1">
                        {videos.map((video) => (
                            <label
                                key={video._id}
                                className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedVideoIds.includes(video._id)}
                                    onChange={() => toggleVideo(video._id)}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm flex-1 truncate">{video.title}</span>
                                <span className="text-xs text-gray-400">{video.isPublished ? "公開" : "非公開"}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="flex gap-4 pt-4 border-t">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-4 py-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        キャンセル
                    </button>
                    <Button type="submit" disabled={isSubmitting} className="font-bold">
                        {isSubmitting ? "作成中..." : "作成する"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
