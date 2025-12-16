"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, Calendar, Lock } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";

export default function AllVideosPage() {
    const videos = useQuery(api.videos.getPublishedVideos);
    const stats = useQuery(api.dashboard.getStats);

    if (videos === undefined) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
            </div>
        );
    }

    return (
        <SidebarProvider>
            <AppSidebar user={stats ? { name: stats.userName, email: stats.userEmail, avatar: stats.userAvatar } : undefined} />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b px-4">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbPage>ナレッジ</BreadcrumbPage>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>ハンズオン動画</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-8 p-4">
                    {/* 学習中の動画セクション */}
                    {stats?.inProgressVideos && stats.inProgressVideos.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                                学習中
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {stats.inProgressVideos.map((video) => (
                                    <Link href={`/videos/${video._id}`} key={video._id} className="group block h-full">
                                        <Card className="h-full overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-blue-200 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-900/10">
                                            <div className="aspect-video bg-muted relative overflow-hidden">
                                                <img
                                                    src={video.thumbnailUrl || `https://image.mux.com/${video.muxPlaybackId}/thumbnail.png?width=640&height=360&fit_mode=smart`}
                                                    alt={video.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform scale-90 group-hover:scale-100">
                                                    <div className="bg-background/90 backdrop-blur-sm rounded-full p-3 shadow-xl">
                                                        <PlayCircle className="w-8 h-8 text-primary" fill="currentColor" fillOpacity={0.2} />
                                                    </div>
                                                </div>
                                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                                                    <div
                                                        className="h-full bg-blue-600"
                                                        style={{ width: `${video.progress}%` }}
                                                    />
                                                </div>
                                                <div className="absolute top-2 left-2 z-10">
                                                    <Badge className="bg-blue-600 text-white border-none shadow-sm">
                                                        残り {Math.max(0, 100 - video.progress)}%
                                                    </Badge>
                                                </div>
                                            </div>
                                            <CardHeader className="p-4 pb-2">
                                                <CardTitle className="line-clamp-2 text-base group-hover:text-primary transition-colors duration-300" title={video.title}>
                                                    {video.title}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-4 pt-0">
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>最終視聴: {new Date(video.lastWatchedAt).toLocaleDateString()}</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold tracking-tight">ハンズオン動画</h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {videos.map((video) => (
                                <Link href={`/videos/${video._id}`} key={video._id} className="group block h-full">
                                    <Card className="h-full overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50">
                                        <div className="aspect-video bg-muted relative overflow-hidden">
                                            <img
                                                src={video.thumbnailUrl || `https://image.mux.com/${video.muxPlaybackId}/thumbnail.png?width=640&height=360&fit_mode=smart`}
                                                alt={video.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform scale-90 group-hover:scale-100">
                                                <div className="bg-background/90 backdrop-blur-sm rounded-full p-3 shadow-xl">
                                                    <PlayCircle className="w-8 h-8 text-primary" fill="currentColor" fillOpacity={0.2} />
                                                </div>
                                            </div>
                                            {video.requiredRoles && video.requiredRoles.length > 0 && (
                                                <div className="absolute top-2 right-2 z-10">
                                                    <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm shadow-sm gap-1">
                                                        <Lock className="w-3 h-3" />
                                                        限定公開
                                                    </Badge>
                                                </div>
                                            )}
                                            <div className="absolute top-2 left-2 z-10 flex gap-2">
                                                {video.userProgress?.completed && (
                                                    <Badge className="bg-green-500/90 hover:bg-green-500 text-white border-none shadow-sm">
                                                        学習済み
                                                    </Badge>
                                                )}
                                                {!video.userProgress?.completed && video.userProgress && video.userProgress.currentTime > 0 && (
                                                    <Badge className="bg-blue-500/90 hover:bg-blue-500 text-white border-none shadow-sm">
                                                        学習中
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <CardHeader className="p-4 pb-2">
                                            <CardTitle className="line-clamp-2 text-base group-hover:text-primary transition-colors duration-300" title={video.title}>
                                                {video.title}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-0">
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                                                <Calendar className="w-3 h-3" />
                                                <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
