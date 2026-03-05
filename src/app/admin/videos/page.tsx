"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BatchIndexButton } from "@/components/admin/BatchIndexButton";
import { Badge } from "@/components/ui/badge";
import { useVideoSearch } from "@/components/videos/useVideoSearch";
import { VideoSearchSort } from "@/components/videos/VideoSearchSort";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

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

    const {
        query: searchQuery,
        setQuery: setSearchQuery,
        sortBy,
        setSortBy,
        sortedVideos,
        isSearching,
        getMatchType,
        resultCount,
        totalCount,
    } = useVideoSearch(videos, { isAdmin: true });

    const scanSecurity = useAction(api.ai.scanTranscriptionSecurity);
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<{
        totalScanned: number;
        videosWithIssues: number;
        results: {
            videoId: string;
            title: string;
            findings: {
                severity: string;
                type: string;
                description: string;
                detectedText?: string;
                location: string;
            }[];
        }[];
    } | null>(null);

    if (videos === undefined) {
        return <VideoListSkeleton />;
    }

    if (videos.length === 0) {
        return <div className="text-muted-foreground text-center py-12">動画がまだありません。</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
                <BatchIndexButton />
                <button
                    onClick={async () => {
                        if (
                            !confirm(
                                "全動画の文字起こし・チャットログをセキュリティスキャンしますか？（数分かかる場合があります）",
                            )
                        )
                            return;
                        setIsScanning(true);
                        setScanResult(null);
                        try {
                            const result = await scanSecurity({});
                            setScanResult(result);
                            if (result.videosWithIssues === 0) {
                                alert(
                                    `スキャン完了: ${result.totalScanned}本の動画を確認しました。問題は見つかりませんでした。`,
                                );
                            } else {
                                alert(
                                    `スキャン完了: ${result.totalScanned}本中 ${result.videosWithIssues}本で問題が検出されました。詳細は下に表示されます。`,
                                );
                            }
                        } catch (error) {
                            alert(`エラー: ${error instanceof Error ? error.message : String(error)}`);
                        } finally {
                            setIsScanning(false);
                        }
                    }}
                    disabled={isScanning}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${
                        isScanning
                            ? "bg-gray-400 cursor-not-allowed text-gray-200"
                            : "bg-red-600 text-white hover:bg-red-700"
                    }`}
                >
                    {isScanning ? (
                        <span className="flex items-center gap-1">
                            <span className="animate-spin">↻</span> セキュリティスキャン中...
                        </span>
                    ) : (
                        "全動画セキュリティスキャン"
                    )}
                </button>
            </div>

            {/* Security Scan Results */}
            {scanResult && scanResult.videosWithIssues > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg p-4 space-y-4">
                    <h3 className="font-bold text-red-900 dark:text-red-300 text-lg">
                        セキュリティスキャン結果: {scanResult.videosWithIssues}本で問題を検出
                    </h3>
                    {scanResult.results.map((video) => (
                        <div
                            key={video.videoId}
                            className="bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-900 p-3"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-bold text-sm">{video.title}</h4>
                                <a
                                    href={`/admin/videos/${video.videoId}/edit`}
                                    className="text-xs text-blue-600 hover:underline"
                                >
                                    編集
                                </a>
                            </div>
                            <div className="space-y-1">
                                {video.findings.map((finding, idx) => (
                                    <div key={idx} className="flex items-start gap-2 text-sm">
                                        <span
                                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${
                                                finding.severity === "critical"
                                                    ? "bg-red-600"
                                                    : finding.severity === "high"
                                                      ? "bg-orange-500"
                                                      : finding.severity === "medium"
                                                        ? "bg-yellow-500"
                                                        : "bg-blue-500"
                                            }`}
                                        >
                                            {finding.severity}
                                        </span>
                                        <span className="text-muted-foreground">{finding.description}</span>
                                        {finding.detectedText && (
                                            <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">
                                                {finding.detectedText}
                                            </code>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <VideoSearchSort
                query={searchQuery}
                onQueryChange={setSearchQuery}
                sortBy={sortBy}
                onSortChange={setSortBy}
                isSearching={isSearching}
                showViewsSort
                resultCount={resultCount}
                totalCount={totalCount}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sortedVideos.map((video) => (
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
                                {(video.securityScanStatus === "pending" ||
                                    video.securityScanStatus === "scanning") && (
                                    <Badge className="bg-blue-500 text-white text-[10px] px-1.5 py-0.5">
                                        スキャン中
                                    </Badge>
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

                            {/* タグ + インデックス状態 */}
                            <div className="flex flex-wrap gap-1">
                                {video.tags &&
                                    video.tags.map((tag: { _id: string; name: string }) => (
                                        <Badge key={tag._id} variant="secondary" className="text-[10px] px-1.5 py-0">
                                            {tag.name}
                                        </Badge>
                                    ))}
                                {!video.transcription && (
                                    <Badge className="bg-gray-400 text-white text-[10px] px-1.5 py-0">
                                        文字起こしなし
                                    </Badge>
                                )}
                                {video.transcription && <ChunkStatusBadge videoId={video._id} />}
                                {searchQuery &&
                                    (getMatchType(video._id) === "rag" || getMatchType(video._id) === "both") && (
                                        <Badge className="bg-purple-600 text-white text-[10px] px-1.5 py-0">
                                            AI検索
                                        </Badge>
                                    )}
                            </div>

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
        </div>
    );
}

function ChunkStatusBadge({ videoId }: { videoId: Id<"videos"> }) {
    const hasChunks = useQuery(api.ragDb.hasChunks, { videoId });
    if (hasChunks === undefined) return null;
    return hasChunks ? (
        <Badge className="bg-green-600 text-white text-[10px] px-1.5 py-0">ベクトル化済</Badge>
    ) : (
        <Badge className="bg-orange-500 text-white text-[10px] px-1.5 py-0">未インデックス</Badge>
    );
}
