"use client";

import { useQuery, useMutation } from "convex/react";
import { useRef } from "react";
import { api } from "../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import MuxPlayer from "@mux/mux-player-react";
import { Id } from "../../../../convex/_generated/dataModel";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Calendar, FileText, List } from "lucide-react";

export default function VideoPage() {
    const params = useParams();
    const videoId = params.id as Id<"videos">;

    const video = useQuery(api.videos.getById, { videoId });
    const access = useQuery(api.users.checkAccess, { videoId });
    const progress = useQuery(api.videoProgress.getProgress, { videoId });
    const updateProgress = useMutation(api.videoProgress.updateProgress);
    const logLearningTime = useMutation(api.videoProgress.logLearningTime);

    // Track watched time for logging
    const lastLoggedTimeRef = useRef<number>(0);
    const accumulatedTimeRef = useRef<number>(0);

    if (video === undefined || access === undefined) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-pulse text-muted-foreground">読み込み中...</div>
            </div>
        );
    }

    if (video === null) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <h2 className="text-2xl font-bold">動画が見つかりません</h2>
                <Button asChild variant="outline">
                    <Link href="/videos">動画一覧に戻る</Link>
                </Button>
            </div>
        );
    }

    if (!access.hasAccess) {
        return (
            <div className="p-8 max-w-4xl mx-auto text-center">
                <Card className="bg-destructive/10 border-destructive/20">
                    <CardHeader>
                        <CardTitle className="text-destructive">アクセス権限がありません</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            この動画を視聴するには、特定のDiscordロールが必要です。
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const handleSeek = (time: number) => {
        const videoEl = document.querySelector('mux-player') as any;
        if (videoEl) {
            videoEl.currentTime = time;
            videoEl.play();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
            {/* Header Section */}
            <div className="space-y-4">
                <Button variant="ghost" asChild className="pl-0 hover:bg-transparent hover:text-primary">
                    <Link href="/videos" className="flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        動画一覧に戻る
                    </Link>
                </Button>

                <div className="space-y-2">
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{video.title}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(video.createdAt).toLocaleDateString()} に公開</span>
                    </div>
                </div>
            </div>

            {/* Video Player Section */}
            <Card className="overflow-hidden border-none shadow-2xl bg-black">
                <div className="aspect-video w-full">
                    <MuxPlayer
                        playbackId={video.muxPlaybackId}
                        metadata={{
                            video_id: video._id,
                            video_title: video.title,
                            viewer_user_id: "user_id_placeholder",
                        }}
                        className="w-full h-full"
                        accentColor="#2563eb"
                        startTime={progress?.currentTime || 0}
                        onTimeUpdate={(e) => {
                            const target = e.target as HTMLVideoElement;
                            const currentTime = target.currentTime;
                            const duration = target.duration;

                            // Update progress every 5 seconds
                            if (Math.floor(currentTime) % 5 === 0) {
                                const isCompleted = duration > 0 && currentTime >= duration * 0.9;
                                updateProgress({
                                    videoId,
                                    currentTime,
                                    completed: isCompleted,
                                });
                            }
                        }}
                        onPlay={() => {
                            // Start tracking time
                        }}
                        onEnded={() => {
                            updateProgress({
                                videoId,
                                currentTime: video.duration || 0,
                                completed: true,
                            });
                        }}
                    />
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content: Description & AI Summary */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Description */}
                    {video.description && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <FileText className="w-5 h-5 text-primary" />
                                    動画について
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                                    {video.description}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* AI Analysis */}
                    {(video.summary || (video.chapters && video.chapters.length > 0)) && (
                        <Card className="border-primary/20 bg-primary/5">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-primary">
                                    <span className="text-2xl">✨</span> AI分析サマリー
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {video.summary && (
                                    <div className="space-y-3">
                                        <h3 className="font-semibold flex items-center gap-2">
                                            💡 要約
                                        </h3>
                                        <div className="bg-background/50 p-4 rounded-lg border border-border/50">
                                            <p className="text-muted-foreground leading-relaxed">
                                                {video.summary}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar: Chapters */}
                <div className="lg:col-span-1">
                    {video.chapters && video.chapters.length > 0 && (
                        <Card className="sticky top-4">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <List className="w-5 h-5" />
                                    チャプター
                                </CardTitle>
                                <CardDescription>
                                    クリックして再生位置を移動
                                </CardDescription>
                            </CardHeader>
                            <Separator />
                            <ScrollArea className="h-[500px]">
                                <div className="p-4 space-y-2">
                                    {video.chapters.map((chapter, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleSeek(chapter.startTime)}
                                            className="w-full text-left group hover:bg-accent rounded-lg p-3 transition-colors duration-200"
                                        >
                                            <div className="flex items-start gap-3">
                                                <Badge variant="secondary" className="font-mono shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                                    {new Date(chapter.startTime * 1000).toISOString().substr(11, 8)}
                                                </Badge>
                                                <div className="space-y-1">
                                                    <p className="font-medium text-sm leading-none group-hover:text-primary transition-colors">
                                                        {chapter.title}
                                                    </p>
                                                    {chapter.description && (
                                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                                            {chapter.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </ScrollArea>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
