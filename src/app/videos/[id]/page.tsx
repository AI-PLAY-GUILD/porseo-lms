"use client";

import { SignOutButton } from "@clerk/nextjs";
import MuxPlayer from "@mux/mux-player-react";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Calendar, FileText, LogOut, MessageSquare, Mic } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { BrutalistLoader } from "@/components/ui/brutalist-loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

// Parse VTT format into timestamped segments
function parseVttToSegments(vttText: string): { startTime: number; endTime: number; text: string }[] {
    const segments: { startTime: number; endTime: number; text: string }[] = [];
    const blocks = vttText.split(/\n\s*\n/);

    for (const block of blocks) {
        const lines = block.trim().split("\n");
        for (let i = 0; i < lines.length; i++) {
            const timeMatch = lines[i].match(
                /(\d{2}):(\d{2}):(\d{2})[.,](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[.,](\d{3})/,
            );
            if (timeMatch) {
                const startTime =
                    Number(timeMatch[1]) * 3600 +
                    Number(timeMatch[2]) * 60 +
                    Number(timeMatch[3]) +
                    Number(timeMatch[4]) / 1000;
                const endTime =
                    Number(timeMatch[5]) * 3600 +
                    Number(timeMatch[6]) * 60 +
                    Number(timeMatch[7]) +
                    Number(timeMatch[8]) / 1000;
                const textLines = lines.slice(i + 1).filter((l) => l.trim().length > 0);
                if (textLines.length > 0) {
                    segments.push({ startTime, endTime, text: textLines.join(" ") });
                }
            }
        }
    }
    return segments;
}

// Parse Zoom chat messages
function parseChatMessages(chatText: string): { time: string; sender: string; message: string }[] {
    const messages: { time: string; sender: string; message: string }[] = [];
    const lines = chatText.split("\n");

    for (const line of lines) {
        // Zoom chat format: "HH:MM:SS From Sender Name to Everyone:" or similar
        const match = line.match(/^(\d{2}:\d{2}:\d{2})\s+From\s+(.+?)\s+to\s+.+?:\s*$/i);
        if (match) {
            // The message content may be on the next line
            continue;
        }
        // Alternative: "HH:MM:SS\tSender Name\tMessage"
        const tabMatch = line.match(/^(\d{2}:\d{2}:\d{2})\t(.+?)\t(.+)$/);
        if (tabMatch) {
            messages.push({ time: tabMatch[1], sender: tabMatch[2], message: tabMatch[3] });
            continue;
        }
        // Format: "HH:MM:SS From Sender : Message" (single-line)
        const singleLineMatch = line.match(/^(\d{2}:\d{2}:\d{2})\s+From\s+(.+?)\s*:\s*(.+)$/i);
        if (singleLineMatch) {
            messages.push({ time: singleLineMatch[1], sender: singleLineMatch[2], message: singleLineMatch[3] });
        }
    }
    return messages;
}

function formatSecondsToTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${m}:${String(s).padStart(2, "0")}`;
}

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

    // Transcription & Chat toggle
    const [showTranscription, setShowTranscription] = useState(false);
    const [showChat, setShowChat] = useState(false);

    // Parse transcription (VTT) into segments
    const transcriptionSegments = useMemo(() => {
        if (!video?.transcription) return [];
        return parseVttToSegments(video.transcription);
    }, [video?.transcription]);

    // Parse chat messages
    const chatMessages = useMemo(() => {
        if (!video?.zoomChatMessages) return [];
        return parseChatMessages(video.zoomChatMessages);
    }, [video?.zoomChatMessages]);

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

                {/* Transcription & Chat Section */}
                {(transcriptionSegments.length > 0 || chatMessages.length > 0) && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Transcription */}
                        {transcriptionSegments.length > 0 && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <button onClick={() => setShowTranscription(!showTranscription)} className="w-full">
                                        <CardTitle className="flex items-center justify-between text-lg">
                                            <span className="flex items-center gap-2">
                                                <Mic className="w-5 h-5 text-primary" />
                                                文字起こし
                                                <Badge variant="secondary" className="text-xs">
                                                    {transcriptionSegments.length}件
                                                </Badge>
                                            </span>
                                            <span className="text-sm text-muted-foreground">
                                                {showTranscription ? "閉じる" : "表示する"}
                                            </span>
                                        </CardTitle>
                                    </button>
                                </CardHeader>
                                {showTranscription && (
                                    <CardContent>
                                        <ScrollArea className="h-[400px]">
                                            <div className="space-y-2">
                                                {transcriptionSegments.map((seg, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => handleSeek(seg.startTime)}
                                                        className="w-full text-left group hover:bg-accent rounded-lg p-2 transition-colors duration-200"
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <Badge
                                                                variant="outline"
                                                                className="font-mono shrink-0 text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                                                            >
                                                                {formatSecondsToTime(seg.startTime)}
                                                            </Badge>
                                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                                {seg.text}
                                                            </p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </CardContent>
                                )}
                            </Card>
                        )}

                        {/* Zoom Chat Messages */}
                        {chatMessages.length > 0 && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <button onClick={() => setShowChat(!showChat)} className="w-full">
                                        <CardTitle className="flex items-center justify-between text-lg">
                                            <span className="flex items-center gap-2">
                                                <MessageSquare className="w-5 h-5 text-primary" />
                                                チャット
                                                <Badge variant="secondary" className="text-xs">
                                                    {chatMessages.length}件
                                                </Badge>
                                            </span>
                                            <span className="text-sm text-muted-foreground">
                                                {showChat ? "閉じる" : "表示する"}
                                            </span>
                                        </CardTitle>
                                    </button>
                                </CardHeader>
                                {showChat && (
                                    <CardContent>
                                        <ScrollArea className="h-[400px]">
                                            <div className="space-y-3">
                                                {chatMessages.map((msg, i) => (
                                                    <div
                                                        key={i}
                                                        className="rounded-lg p-3 bg-muted/50 border border-border/50"
                                                    >
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Badge variant="outline" className="font-mono text-xs">
                                                                {msg.time}
                                                            </Badge>
                                                            <span className="text-sm font-medium">{msg.sender}</span>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground pl-1">
                                                            {msg.message}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </CardContent>
                                )}
                            </Card>
                        )}
                    </div>
                )}

                {/* Raw Transcription (fallback if VTT parsing yields nothing but text exists) */}
                {video.transcription && transcriptionSegments.length === 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Mic className="w-5 h-5 text-primary" />
                                文字起こし
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[300px]">
                                <p className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
                                    {video.transcription}
                                </p>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                )}

                {/* Raw Chat (fallback if chat parsing yields nothing but text exists) */}
                {video.zoomChatMessages && chatMessages.length === 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <MessageSquare className="w-5 h-5 text-primary" />
                                Zoomチャット
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[300px]">
                                <p className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
                                    {video.zoomChatMessages}
                                </p>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
