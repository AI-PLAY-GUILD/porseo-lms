"use client";

import { SignOutButton, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { CheckCircle, Clock, LogOut, PlayCircle } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { Badge } from "@/components/ui/badge";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { BrutalistLoader } from "@/components/ui/brutalist-loader";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function CourseDetailPage() {
    const params = useParams();
    const courseId = params.id as Id<"courses">;
    const router = useRouter();
    const course = useQuery(api.courses.getCourseById, { courseId });
    const stats = useQuery(api.dashboard.getStats);
    const { user } = useUser();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isMounted && stats) {
            const status = stats.subscriptionStatus;
            if (status !== "active" && status !== "past_due") {
                router.push("/join");
            }
        }
    }, [isMounted, stats, router]);

    if (!isMounted || course === undefined) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-cream">
                <BrutalistLoader />
            </div>
        );
    }

    if (course === null) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-cream">
                <p className="text-gray-500 font-bold">コースが見つかりません。</p>
            </div>
        );
    }

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
        return `${m}:${String(s).padStart(2, "0")}`;
    };

    return (
        <SidebarProvider>
            <AppSidebar
                user={
                    stats
                        ? {
                              name: stats.userName,
                              email: user?.emailAddresses?.[0]?.emailAddress,
                              avatar: stats.userAvatar,
                          }
                        : undefined
                }
            />
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
                                    <BreadcrumbLink
                                        href="/courses"
                                        className="font-bold text-gray-600 hover:text-black"
                                    >
                                        コース
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="text-black" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="font-black text-black truncate max-w-[200px]">
                                        {course.title}
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    <div className="ml-auto">
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
                </header>
                <div className="flex flex-1 flex-col gap-6 p-6 max-w-4xl">
                    {/* コースヘッダー */}
                    <div className="border-4 border-black bg-white rounded-xl p-6 brutal-shadow">
                        <h1 className="text-3xl font-black text-black mb-2">{course.title}</h1>
                        {course.description && (
                            <p className="text-gray-600 mb-4 whitespace-pre-wrap">{course.description}</p>
                        )}
                        <div className="flex items-center gap-4">
                            <Badge className="bg-pop-purple text-white border-2 border-black font-bold">
                                {course.totalCount}本の動画
                            </Badge>
                            {course.completedCount > 0 && (
                                <Badge className="bg-pop-green text-black border-2 border-black font-bold">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    {course.completedCount}/{course.totalCount} 完了
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* 動画リスト */}
                    <div className="space-y-3">
                        {course.videos.map((video, index) => (
                            <Link key={video._id} href={`/videos/${video._id}`} className="group block">
                                <div className="flex items-center gap-4 p-4 border-4 border-black bg-white rounded-xl hover:shadow-none transition-all duration-300 hover:translate-x-1 hover:translate-y-1 brutal-shadow">
                                    {/* 番号 */}
                                    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg border-2 border-black font-black text-lg bg-pop-yellow">
                                        {index + 1}
                                    </div>

                                    {/* サムネイル */}
                                    <div className="flex-shrink-0 w-32 aspect-video bg-muted rounded-lg overflow-hidden border-2 border-black relative">
                                        <img
                                            src={
                                                video.thumbnailUrl ||
                                                `https://image.mux.com/${video.muxPlaybackId}/thumbnail.png?width=320&height=180&fit_mode=smart`
                                            }
                                            alt={video.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <PlayCircle className="w-8 h-8 text-white drop-shadow-lg" />
                                        </div>
                                    </div>

                                    {/* タイトル + 情報 */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-black group-hover:text-pop-purple transition-colors truncate">
                                            {video.title}
                                        </h3>
                                        {video.duration > 0 && (
                                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                                <Clock className="w-3 h-3" />
                                                <span>{formatDuration(video.duration)}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* 進捗バッジ */}
                                    <div className="flex-shrink-0">
                                        {video.progress?.completed ? (
                                            <Badge className="bg-pop-green text-black border-2 border-black font-bold">
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                完了
                                            </Badge>
                                        ) : video.progress ? (
                                            <Badge className="bg-pop-yellow text-black border-2 border-black font-bold">
                                                学習中
                                            </Badge>
                                        ) : null}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
