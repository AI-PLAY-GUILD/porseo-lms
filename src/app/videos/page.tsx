"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, Calendar, Lock, Clock } from "lucide-react";
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

import { BrutalistLoader } from "@/components/ui/brutalist-loader";

export default function AllVideosPage() {
    const videos = useQuery(api.videos.getPublishedVideos);
    const stats = useQuery(api.dashboard.getStats);

    if (videos === undefined) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-cream">
                <BrutalistLoader />
            </div>
        );
    }

    return (
        <SidebarProvider>
            <AppSidebar user={stats ? { name: stats.userName, email: stats.userEmail, avatar: stats.userAvatar } : undefined} />
            <SidebarInset className="bg-cream">
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 w-full bg-cream px-4">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="hover:bg-pop-yellow border-2 border-black rounded-md transition-colors text-black" />
                        <Separator orientation="vertical" className="mr-2 h-4 bg-black" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="font-bold text-gray-600">ナレッジ</BreadcrumbPage>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="text-black" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="font-black text-black">ハンズオン動画</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-8 p-6">
                    {/* 学習中の動画セクション */}
                    {stats?.inProgressVideos && stats.inProgressVideos.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-3xl font-black tracking-tight flex items-center gap-2 text-black">
                                <span className="bg-pop-yellow px-2 border-2 border-black transform -rotate-1 inline-block brutal-shadow-sm text-lg align-middle mr-2 text-black">CONTINUE</span>
                                学習中
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {stats.inProgressVideos.map((video) => (
                                    <Link href={`/videos/${video._id}`} key={video._id} className="group block h-full">
                                        <Card className="h-full overflow-hidden hover:shadow-none transition-all duration-300 hover:translate-x-1 hover:translate-y-1 border-4 border-black bg-white brutal-shadow rounded-xl">
                                            <div className="aspect-video bg-muted relative overflow-hidden border-b-4 border-black">
                                                <img
                                                    src={(video as any).thumbnailUrl || `https://image.mux.com/${video.muxPlaybackId}/thumbnail.png?width=640&height=360&fit_mode=smart`}
                                                    alt={video.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform scale-90 group-hover:scale-100">
                                                    <div className="bg-pop-red rounded-full p-3 border-2 border-black brutal-shadow-sm">
                                                        <PlayCircle className="w-8 h-8 text-white" fill="currentColor" fillOpacity={0.2} />
                                                    </div>
                                                </div>
                                                <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-200 border-t-2 border-black">
                                                    <div
                                                        className="h-full bg-pop-purple"
                                                        style={{ width: `${video.progress}%` }}
                                                    />
                                                </div>
                                                <div className="absolute top-2 left-2 z-10">
                                                    <Badge className="bg-pop-yellow text-black border-2 border-black shadow-sm font-bold rounded-md">
                                                        {video.progress}%
                                                    </Badge>
                                                </div>
                                            </div>
                                            <CardHeader className="p-4 pb-2">
                                                <CardTitle className="line-clamp-2 text-lg font-black text-black group-hover:text-pop-purple transition-colors duration-300 leading-tight" title={video.title}>
                                                    {video.title}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-4 pt-0">
                                                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mt-2">
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
                            <h2 className="text-3xl font-black tracking-tight text-black">ハンズオン動画</h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {videos.map((video) => (
                                <Link href={`/videos/${video._id}`} key={video._id} className="group block h-full">
                                    <Card className="h-full overflow-hidden hover:shadow-none transition-all duration-300 hover:translate-x-1 hover:translate-y-1 border-4 border-black bg-white brutal-shadow rounded-xl">
                                        <div className="aspect-video bg-muted relative overflow-hidden border-b-4 border-black">
                                            <img
                                                src={(video as any).thumbnailUrl || `https://image.mux.com/${video.muxPlaybackId}/thumbnail.png?width=640&height=360&fit_mode=smart`}
                                                alt={video.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform scale-90 group-hover:scale-100">
                                                <div className="bg-pop-purple rounded-full p-3 border-2 border-black brutal-shadow-sm">
                                                    <PlayCircle className="w-8 h-8 text-white" fill="currentColor" fillOpacity={0.2} />
                                                </div>
                                            </div>
                                            {video.requiredRoles && video.requiredRoles.length > 0 && (
                                                <div className="absolute top-2 right-2 z-10">
                                                    <Badge variant="secondary" className="bg-gray-900 text-white border-2 border-white/20 backdrop-blur-sm shadow-sm gap-1 font-bold">
                                                        <Lock className="w-3 h-3" />
                                                        限定公開
                                                    </Badge>
                                                </div>
                                            )}
                                            <div className="absolute top-2 left-2 z-10 flex gap-2">
                                                {video.userProgress?.completed && (
                                                    <Badge className="bg-pop-green text-black border-2 border-black shadow-sm font-bold">
                                                        学習済み
                                                    </Badge>
                                                )}
                                                {!video.userProgress?.completed && video.userProgress && (
                                                    <Badge className="bg-pop-yellow text-black border-2 border-black shadow-sm font-bold">
                                                        学習中
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <CardHeader className="p-4 pb-2">
                                            <CardTitle className="line-clamp-2 text-lg font-black text-black group-hover:text-pop-purple transition-colors duration-300 leading-tight" title={video.title}>
                                                {video.title}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-0">
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mt-2">
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
