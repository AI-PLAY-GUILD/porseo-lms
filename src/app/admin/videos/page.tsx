"use client";

import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { api } from "../../../../convex/_generated/api";

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
        <div className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">動画管理</h2>
            </div>
            <p className="text-sm text-muted-foreground">アップロードされた動画の管理・編集ができます。</p>
            <VideoList />
        </div>
    );
}

function VideoListSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-xl border bg-card overflow-hidden animate-pulse">
                    <div className="aspect-video bg-muted" />
                    <div className="p-3 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function VideoList() {
    const videos = useQuery(api.videos.getVideos);
    const updateVideo = useMutation(api.videos.updateVideo);
    const deleteVideo = useMutation(api.videos.deleteVideo);

    if (videos === undefined) {
        return <VideoListSkeleton />;
    }

    if (videos.length === 0) {
        return <div className="text-muted-foreground text-center py-12">動画がまだありません。</div>;
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {videos.map((video) => (
                <div
                    key={video._id}
                    className="group rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow"
                >
                    {/* サムネイル */}
                    <div className="relative aspect-video bg-muted">
                        {video.thumbnailUrl || video.muxPlaybackId ? (
                            <img
                                src={
                                    video.thumbnailUrl ||
                                    `https://image.mux.com/${video.muxPlaybackId}/thumbnail.png?width=480&height=270&fit_mode=smartcrop`
                                }
                                alt={video.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                                No Image
                            </div>
                        )}

                        {/* オーバーレイバッジ群 */}
                        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                            {video.source === "zoom" && (
                                <Badge className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5">Zoom</Badge>
                            )}
                            {!video.muxAssetId && (
                                <Badge className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5">処理中</Badge>
                            )}
                            {video.securityScanStatus === "warning" && (
                                <Badge className="bg-red-600 text-white text-[10px] px-1.5 py-0.5">
                                    セキュリティ警告
                                </Badge>
                            )}
                            {(video.securityScanStatus === "pending" || video.securityScanStatus === "scanning") && (
                                <Badge className="bg-blue-500 text-white text-[10px] px-1.5 py-0.5">スキャン中</Badge>
                            )}
                            {video.securityScanStatus === "error" && (
                                <Badge className="bg-yellow-500 text-white text-[10px] px-1.5 py-0.5">
                                    スキャンエラー
                                </Badge>
                            )}
                        </div>

                        {/* 公開状態バッジ */}
                        <div className="absolute top-2 right-2">
                            <button
                                onClick={() => updateVideo({ videoId: video._id, isPublished: !video.isPublished })}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    video.isPublished ? "bg-green-500 text-white" : "bg-gray-700/80 text-gray-200"
                                }`}
                            >
                                {video.isPublished ? "公開中" : "非公開"}
                            </button>
                        </div>
                    </div>

                    {/* コンテンツ */}
                    <div className="p-3 space-y-2">
                        <a
                            href={`/videos/${video._id}`}
                            className="text-sm font-semibold leading-tight line-clamp-2 hover:text-blue-600 transition-colors"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {video.title}
                        </a>

                        {/* タグ */}
                        {video.tags && video.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {video.tags.map((tag: { _id: string; name: string }) => (
                                    <Badge key={tag._id} variant="secondary" className="text-[10px] px-1.5 py-0">
                                        {tag.name}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {/* メタ情報 + 操作 */}
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                            <div className="flex items-center gap-2">
                                <span>
                                    {/* @ts-ignore */}
                                    {video.views ?? 0}回再生
                                </span>
                                <span>·</span>
                                <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <a
                                    href={`/admin/videos/${video._id}/edit`}
                                    className="text-blue-600 hover:text-blue-800 font-medium px-1.5 py-0.5 rounded hover:bg-blue-50"
                                >
                                    編集
                                </a>
                                <button
                                    onClick={() => {
                                        if (confirm("本当に削除しますか？")) {
                                            deleteVideo({ videoId: video._id });
                                        }
                                    }}
                                    className="text-red-500 hover:text-red-700 font-medium px-1.5 py-0.5 rounded hover:bg-red-50"
                                >
                                    削除
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
