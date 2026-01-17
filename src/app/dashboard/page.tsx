"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AppSidebar } from "@/components/app-sidebar";
import { SectionCards } from "@/components/section-cards";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PlayCircle, Clock, LogOut } from "lucide-react";
import Link from "next/link";
import { SignOutButton } from "@clerk/nextjs";
import { BrutalistLoader } from "@/components/ui/brutalist-loader";
import { Id } from "../../../convex/_generated/dataModel";

interface Video {
  _id: Id<"videos">;
  title: string;
  thumbnailUrl?: string;
  muxPlaybackId?: string;
  duration?: number;
}

interface VideoProgress {
  videoId: Id<"videos">;
  completed: boolean;
  lastWatchedAt: number;
  currentTime: number;
}

interface DailyLog {
  date: string;
  minutesWatched: number;
}

export default function DashboardPage() {
  const userData = useQuery(api.users.getUser);
  const videos = useQuery(api.videos.getVideos);
  const progress = useQuery(api.videoProgress.getUserProgress);
  const dailyLogs = useQuery(api.videoProgress.getDailyLearningLogs);

  if (userData === undefined || videos === undefined || progress === undefined || dailyLogs === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <BrutalistLoader />
      </div>
    );
  }

  if (userData === null) {
    return <div>ユーザー情報の取得に失敗しました。</div>;
  }

  // Calculate stats
  const completedVideos = progress.filter((p: VideoProgress) => p.completed);
  const completedCount = completedVideos.length;

  // Rank calculation
  let rank = "Beginner";
  let itemsToNext = 5 - completedCount;
  if (completedCount >= 5) {
    rank = "Intermediate";
    itemsToNext = 10 - completedCount;
  }
  if (completedCount >= 10) {
    rank = "Advanced";
    itemsToNext = 20 - completedCount;
  }
  if (completedCount >= 20) {
    rank = "Expert";
    itemsToNext = 0;
  }
  if (itemsToNext < 0) itemsToNext = 0;

  // Streak calculation (simplified)
  const streakDays = 0; // Implement actual streak logic if needed

  // Chart data calculation
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const chartData = last7Days.map(date => {
    // Format date as YYYY-MM-DD for lookup
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;

    const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    const log = dailyLogs.find((l: DailyLog) => l.date === dateKey);
    const minutes = log ? log.minutesWatched : 0;
    const hours = minutes / 60;

    return {
      name: dateStr,
      hours: hours,
    };
  });

  // In-progress videos
  const inProgressVideos = progress
    .filter((p: VideoProgress) => !p.completed)
    .map((p: VideoProgress) => {
      const video = videos.find((v: Video) => v._id === p.videoId);
      if (!video) return null;
      return {
        ...video,
        progress: video.duration ? Math.round((p.currentTime / video.duration) * 100) : 0,
        lastWatchedAt: p.lastWatchedAt,
      };
    })
    .filter((v: any) => v !== null)
    .sort((a: any, b: any) => b.lastWatchedAt - a.lastWatchedAt);

  const stats = {
    completedCount,
    rank,
    itemsToNext,
    streakDays,
    totalVideos: videos.length,
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar user={{ name: userData.name, email: userData.email, avatar: userData.imageUrl }} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">ホーム</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>ダッシュボード</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto">
            <SignOutButton>
              <Button variant="outline" size="sm" className="font-bold border-2 border-black bg-white hover:bg-gray-100 brutal-shadow-sm">
                <LogOut className="mr-2 h-4 w-4" />
                ログアウト
              </Button>
            </SignOutButton>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <SectionCards stats={stats} />
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-7 px-4 lg:px-6">
              <div className="col-span-1 lg:col-span-4">
                <ChartAreaInteractive data={chartData} />
              </div>
              <Card className="col-span-1 lg:col-span-3">
                <CardHeader>
                  <CardTitle>学習中のコンテンツ</CardTitle>
                  <CardDescription>前回の続きから始めましょう</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {inProgressVideos.length > 0 ? (
                      inProgressVideos.slice(0, 3).map((video: any) => (
                        <Link href={`/videos/${video._id}`} key={video._id} className="flex flex-col gap-2 group hover:bg-muted/50 p-2 rounded-xl transition-colors border border-transparent hover:border-border">
                          <div className="flex items-center gap-4">
                            <div className="relative h-16 w-28 overflow-hidden rounded-lg bg-muted shrink-0 border shadow-sm">
                              <img
                                src={video.thumbnailUrl || `https://image.mux.com/${video.muxPlaybackId}/thumbnail.png?width=200&height=112&fit_mode=smart`}
                                alt={video.title}
                                className="h-full w-full object-cover"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                <PlayCircle className="h-6 w-6 text-white drop-shadow-md" />
                              </div>
                            </div>
                            <div className="flex-1 space-y-1 min-w-0">
                              <p className="text-sm font-medium leading-none line-clamp-1 group-hover:text-primary transition-colors" title={video.title}>
                                {video.title}
                              </p>
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Clock className="mr-1 h-3 w-3" />
                                <span suppressHydrationWarning>
                                  {new Date(video.lastWatchedAt).toLocaleDateString("ja-JP")}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="w-full pl-1 pr-1">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                              <span>進捗</span>
                              <span>{video.progress}%</span>
                            </div>
                            <Progress value={video.progress} className="h-1.5" />
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">学習中の動画はありません</p>
                        <Button variant="link" asChild className="mt-2 font-normal text-primary">
                          <Link href="/videos">動画一覧を見る</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
