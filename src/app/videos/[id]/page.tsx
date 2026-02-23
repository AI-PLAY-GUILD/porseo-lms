"use client";

import { SignOutButton } from "@clerk/nextjs";
import MuxPlayer from "@mux/mux-player-react";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Calendar, FileText, LogOut } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { BrutalistLoader } from "@/components/ui/brutalist-loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

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
                <BrutalistLoader />
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
                        <p className="text-muted-foreground">この動画を視聴するには、特定のDiscordロールが必要です。</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const handleSeek = (time: number) => {
        const videoEl = document.querySelector("mux-player") as
            | (HTMLElement & { currentTime: number; play: () => void })
            | null;
        if (videoEl) {
            videoEl.currentTime = time;
            videoEl.play();
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    return (
        <div className="w-full max-w-[1800px] mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
            {/* Header Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" asChild className="pl-0 hover:bg-transparent hover:text-primary">
                        <Link href="/videos" className="flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            動画一覧に戻る
                        </Link>
                    </Button>
                    <SignOutButton>
                        <Button
                            variant="outline"
                            size="sm"
                            className="font-bold border-2 border-black bg-white hover:bg-gray-100 brutal-shadow-sm"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            ログアウト
                        </Button>
                    </SignOutButton>
                </div>

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

                            // Log learning time
                            const now = Date.now();
                            if (lastLoggedTimeRef.current > 0) {
                                const diff = (now - lastLoggedTimeRef.current) / 1000 / 60; // minutes
                                if (diff > 0 && diff < 1) {
                                    // Ignore large jumps (e.g. pause/resume after long time)
                                    accumulatedTimeRef.current += diff;
                                }
                            }
                            lastLoggedTimeRef.current = now;

                            // Sync to server every 30 seconds or if accumulated > 1 minute
                            if (accumulatedTimeRef.current >= 0.5) {
                                // 30 seconds
                                logLearningTime({ minutesWatched: accumulatedTimeRef.current });
                                accumulatedTimeRef.current = 0;
                            }
                        }}
                        onPlay={() => {
                            lastLoggedTimeRef.current = Date.now();
                        }}
                        onPause={() => {
                            // Flush remaining time
                            if (accumulatedTimeRef.current > 0) {
                                logLearningTime({ minutesWatched: accumulatedTimeRef.current });
                                accumulatedTimeRef.current = 0;
                            }
                            lastLoggedTimeRef.current = 0;
                        }}
                        onEnded={() => {
                            updateProgress({
                                videoId,
                                currentTime: video.duration || 0,
                                completed: true,
                            });
                            // Flush remaining time
                            if (accumulatedTimeRef.current > 0) {
                                logLearningTime({ minutesWatched: accumulatedTimeRef.current });
                                accumulatedTimeRef.current = 0;
                            }
                            lastLoggedTimeRef.current = 0;
                        }}
                    />
                </div>
            </Card>

            <div className="space-y-8">
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

                {/* AI Analysis (Summary & Chapters) */}
                {(video.summary || (video.chapters && video.chapters.length > 0)) && (
                    <Card className="border-primary/20 bg-primary/5">
                        <CardContent className="space-y-8 pt-6">
                            {video.summary && (
                                <div className="space-y-3">
                                    <h3 className="font-semibold flex items-center gap-2">要約</h3>
                                    <div className="bg-background/50 p-4 rounded-lg border border-border/50">
                                        <p className="text-muted-foreground leading-relaxed">{video.summary}</p>
                                    </div>
                                </div>
                            )}

                            {video.chapters && video.chapters.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="font-semibold flex items-center gap-2">チャプター</h3>
                                    <div className="bg-background/50 rounded-lg border border-border/50 overflow-hidden">
                                        <ScrollArea className="h-[300px]">
                                            <div className="p-2 space-y-1">
                                                {video.chapters.map((chapter, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => handleSeek(chapter.startTime)}
                                                        className="w-full text-left group hover:bg-accent rounded-lg p-2 transition-colors duration-200"
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <Badge
                                                                variant="secondary"
                                                                className="font-mono shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                                                            >
                                                                {new Date(chapter.startTime * 1000)
                                                                    .toISOString()
                                                                    .substr(11, 8)}
                                                            </Badge>
                                                            <div className="space-y-1">
                                                                <p className="font-medium text-sm leading-none group-hover:text-primary transition-colors">
                                                                    {chapter.title}
                                                                </p>
                                                                {chapter.description && (
                                                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                                                        {chapter.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
