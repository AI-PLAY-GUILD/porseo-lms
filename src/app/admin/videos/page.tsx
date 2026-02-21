"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function VideoListPage() {
    const userData = useQuery(api.users.getUser);
    const router = useRouter();

    useEffect(() => {
        if (userData !== undefined && !userData?.isAdmin) {
            router.push("/");
        }
    }, [userData, router]);

    if (userData === undefined) {
        return <div className="p-8">読み込み中...</div>;
    }

    if (!userData?.isAdmin) {
        return null;
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">動画管理</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>動画一覧</CardTitle>
                    <CardDescription>
                        アップロードされた動画の管理・編集ができます。
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <VideoList />
                </CardContent>
            </Card>
        </div>
    );
}

import { Badge } from "@/components/ui/badge";

function VideoList() {
    const videos = useQuery(api.videos.getVideos);
    const updateVideo = useMutation(api.videos.updateVideo);
    const deleteVideo = useMutation(api.videos.deleteVideo);

    if (videos === undefined) {
        return <div>読み込み中...</div>;
    }

    if (videos.length === 0) {
        return <div className="text-gray-500">動画がまだありません。</div>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b dark:border-gray-700">
                        <th className="py-3 px-4">タイトル</th>
                        <th className="py-3 px-4">タグ</th>
                        <th className="py-3 px-4">状態</th>
                        <th className="py-3 px-4">再生回数</th>
                        <th className="py-3 px-4">作成日</th>
                        <th className="py-3 px-4">操作</th>
                    </tr>
                </thead>
                <tbody>
                    {videos.map((video) => (
                        <tr key={video._id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="py-3 px-4 font-medium">
                                <div className="flex items-center gap-2">
                                    <a href={`/videos/${video._id}`} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                                        {video.title}
                                    </a>
                                    {video.source === "zoom" && (
                                        <Badge variant="outline" className="text-xs border-blue-500 text-blue-600">
                                            Zoom
                                        </Badge>
                                    )}
                                    {!video.muxAssetId && (
                                        <Badge variant="outline" className="text-xs border-orange-400 text-orange-500">
                                            処理中...
                                        </Badge>
                                    )}
                                </div>
                            </td>
                            <td className="py-3 px-4">
                                <div className="flex flex-wrap gap-1">
                                    {video.tags && video.tags.length > 0 ? (
                                        video.tags.map((tag: { _id: string; name: string }) => (
                                            <Badge key={tag._id} variant="secondary" className="text-xs">
                                                {tag.name}
                                            </Badge>
                                        ))
                                    ) : (
                                        <span className="text-xs text-gray-400">-</span>
                                    )}
                                </div>
                            </td>
                            <td className="py-3 px-4">
                                <button
                                    onClick={() => updateVideo({ videoId: video._id, isPublished: !video.isPublished })}
                                    className={`px-3 py-1 rounded-full text-xs font-bold ${video.isPublished
                                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                        }`}
                                >
                                    {video.isPublished ? "公開中" : "非公開"}
                                </button>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-500">
                                {/* @ts-ignore */}
                                {video.views ?? 0}回
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-500">
                                {new Date(video.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 flex gap-2">
                                <a
                                    href={`/admin/videos/${video._id}/edit`}
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium px-2 py-1"
                                >
                                    編集
                                </a>
                                <button
                                    onClick={() => {
                                        if (confirm("本当に削除しますか？")) {
                                            deleteVideo({ videoId: video._id });
                                        }
                                    }}
                                    className="text-red-600 hover:text-red-800 text-sm font-medium px-2 py-1"
                                >
                                    削除
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
