"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useUser, SignOutButton } from "@clerk/nextjs";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlayCircle, Lock, BookOpen, Clock, Trophy, Activity, LogOut } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { PaymentFailureDialog } from "@/components/payment-failure-dialog";


import { BrutalistLoader } from "@/components/ui/brutalist-loader";

export default function DashboardPage() {
  const router = useRouter();
  const videos = useQuery(api.videos.getPublishedVideos);
  const stats = useQuery(api.dashboard.getStats);

  const { user, isLoaded: isUserLoaded } = useUser();
  const syncUser = useMutation(api.users.syncCurrentUser);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const chartConfig = {
    hours: {
      label: "学習時間 (時間)",
      color: "hsl(var(--primary))",
    },
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const sync = async () => {
      if (stats === null && isUserLoaded && user && !isSyncing) {
        setIsSyncing(true);
        try {
          await syncUser();
        } catch (error) {
          console.error("Failed to sync user:", error);
        } finally {
          setIsSyncing(false);
        }
      }
    };
    sync();
  }, [stats, isUserLoaded, user, isSyncing, syncUser]);

  // Gatekeeper: Redirect if not active and not past_due
  useEffect(() => {
    if (isMounted && stats) {
      const status = stats.subscriptionStatus;
      if (status !== 'active' && status !== 'past_due') {
        router.push('/join');
      }
    }
  }, [isMounted, stats, router]);

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f6f6f8] dark:bg-[#101622]">
        <BrutalistLoader />
      </div>
    );
  }

  // statsがnullの場合は未ログインかユーザーが存在しない（通常はmiddlewareで弾かれるが念のため）
  if (stats === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f6f6f8] dark:bg-[#101622] flex-col">
        <BrutalistLoader />
        <p className="mt-4 font-light text-muted-foreground animate-pulse">ユーザー情報を同期中...</p>
      </div>
    );
  }

  if (videos === undefined || stats === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f6f6f8] dark:bg-[#101622]">
        <BrutalistLoader />
      </div>
    );
  }

  return (
    <SidebarProvider>
      {stats && <PaymentFailureDialog subscriptionStatus={stats.subscriptionStatus} />}
      <AppSidebar user={{ name: stats.userName, email: stats.userEmail, avatar: stats.userAvatar }} />
      <SidebarInset className="bg-[#f6f6f8] dark:bg-[#101622] relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 w-full bg-white/5 backdrop-blur-md border-b border-white/10 px-4 relative z-10">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="hover:bg-white/10 rounded-md transition-colors" />
            <Separator orientation="vertical" className="mr-2 h-4 bg-white/10" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="#" className="font-light text-muted-foreground hover:text-foreground">学習プラットフォーム</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="text-muted-foreground" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-normal text-foreground">ダッシュボード</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto">
            <SignOutButton>
              <Button variant="outline" size="sm" className="font-light border border-white/20 bg-white/5 hover:bg-white/10 shadow-sm backdrop-blur-sm">
                <LogOut className="mr-2 h-4 w-4" />
                ログアウト
              </Button>
            </SignOutButton>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6 pt-6 relative z-10">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-thin tracking-tight text-foreground">ダッシュボード</h2>
            <div className="flex items-center space-x-2">
              <Button asChild className="font-normal rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all">
                <Link href="/videos">学習を始める</Link>
              </Button>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-white/5 border border-white/10 gap-1 p-1 h-auto rounded-full backdrop-blur-sm">
              <TabsTrigger value="overview" className="data-[state=active]:bg-white/10 data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-full px-4 py-2 h-auto transition-all font-light">概要</TabsTrigger>
              <TabsTrigger value="analytics" disabled className="rounded-full px-4 py-2 h-auto cursor-not-allowed opacity-50 font-light">分析</TabsTrigger>
              <TabsTrigger value="reports" disabled className="rounded-full px-4 py-2 h-auto cursor-not-allowed opacity-50 font-light">レポート</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                <Card className="glass-panel rounded-2xl overflow-hidden hover:bg-white/20 transition-colors duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-white/10">
                    <CardTitle className="text-sm font-normal text-muted-foreground uppercase tracking-wider">総学習時間</CardTitle>
                    <Clock className="h-5 w-5 text-primary" />
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="text-3xl font-thin text-foreground">
                      {Math.floor(stats.totalMinutes / 60)}<span className="text-lg font-light text-muted-foreground ml-1">時間</span> {stats.totalMinutes % 60}<span className="text-lg font-light text-muted-foreground ml-1">分</span>
                    </div>
                    <p className="text-xs font-light text-muted-foreground mt-1">継続は力なり！</p>
                  </CardContent>
                </Card>
                <Card className="glass-panel rounded-2xl overflow-hidden hover:bg-white/20 transition-colors duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-white/10">
                    <CardTitle className="text-sm font-normal text-muted-foreground uppercase tracking-wider">完了した動画</CardTitle>
                    <BookOpen className="h-5 w-5 text-accent" />
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="text-3xl font-thin text-foreground">{stats.completedCount}<span className="text-lg font-light text-muted-foreground ml-1">本</span></div>
                    <p className="text-xs font-light text-muted-foreground mt-1">
                      {videos.length > 0 ? `全コンテンツの ${Math.round((stats.completedCount / videos.length) * 100)}%` : "0%"}
                    </p>
                  </CardContent>
                </Card>
                <Card className="glass-panel rounded-2xl overflow-hidden hover:bg-white/20 transition-colors duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-white/10">
                    <CardTitle className="text-sm font-normal text-muted-foreground uppercase tracking-wider">現在のランク</CardTitle>
                    <Trophy className="h-5 w-5 text-yellow-500" />
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="text-3xl font-thin text-foreground">{stats.rank}</div>
                    <p className="text-xs font-light text-muted-foreground mt-1">次のランクまであと{stats.itemsToNext}本</p>
                  </CardContent>
                </Card>
                <Card className="glass-panel rounded-2xl overflow-hidden hover:bg-white/20 transition-colors duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-white/10">
                    <CardTitle className="text-sm font-normal text-muted-foreground uppercase tracking-wider">連続学習記録</CardTitle>
                    <Activity className="h-5 w-5 text-green-500" />
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="text-3xl font-thin text-foreground">{stats.streakDays}</div>
                    <p className="text-xs font-light text-muted-foreground mt-1">日連続</p>
                  </CardContent>
                </Card>
              </div>



              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
                {/* Chart Section */}
                <Card className="col-span-1 md:col-span-2 lg:col-span-4 glass-panel rounded-2xl overflow-hidden">
                  <CardHeader className="border-b border-white/10">
                    <CardTitle className="font-normal text-xl text-foreground">学習の推移</CardTitle>
                    <CardDescription className="font-light text-muted-foreground">過去7日間の学習時間</CardDescription>
                  </CardHeader>
                  <CardContent className="pl-2 pt-6">
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                      <BarChart data={stats.chartData}>
                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} className="font-light" />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}時間`} className="font-light" />
                        <ChartTooltip content={<ChartTooltipContent className="glass-panel border-white/20 font-light rounded-lg" />} />
                        <Bar dataKey="hours" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* In-Progress Videos Section */}
                <Card className="col-span-1 md:col-span-2 lg:col-span-3 glass-panel rounded-2xl overflow-hidden">
                  <CardHeader className="border-b border-white/10">
                    <CardTitle className="font-normal text-xl text-foreground">学習中のコンテンツ</CardTitle>
                    <CardDescription className="font-light text-muted-foreground">前回の続きから始めましょう</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {stats.inProgressVideos && stats.inProgressVideos.length > 0 ? (
                        stats.inProgressVideos.slice(0, 3).map((video) => (
                          <Link href={`/videos/${video._id}`} key={video._id} className="flex flex-col gap-2 group hover:bg-white/5 p-2 rounded-xl transition-colors border border-transparent hover:border-white/10">
                            <div className="flex items-center gap-4">
                              <div className="relative h-16 w-28 overflow-hidden rounded-lg bg-muted shrink-0 border border-white/10 shadow-sm">
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
                                <p className="text-sm font-normal leading-none line-clamp-1 group-hover:text-primary transition-colors" title={video.title}>
                                  {video.title}
                                </p>
                                <div className="flex items-center text-xs font-light text-muted-foreground">
                                  <Clock className="mr-1 h-3 w-3" />
                                  <span suppressHydrationWarning>
                                    {new Date(video.lastWatchedAt).toLocaleDateString("ja-JP")}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="w-full pl-1 pr-1">
                              <div className="flex justify-between text-xs font-light text-muted-foreground mb-1">
                                <span>進捗</span>
                                <span>{video.progress}%</span>
                              </div>
                              <Progress value={video.progress} className="h-1.5 bg-secondary/50 [&>div]:bg-primary rounded-full" />
                            </div>
                          </Link>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <p className="text-sm font-light">学習中の動画はありません</p>
                          <Button variant="link" asChild className="mt-2 font-normal text-primary hover:text-primary/80">
                            <Link href="/videos">動画一覧を見る</Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-8 flex justify-center">
                <Button asChild size="lg" variant="outline" className="bg-white/5 text-foreground border border-white/20 shadow-sm font-light hover:bg-white/10 hover:scale-105 transition-all rounded-full px-8 backdrop-blur-sm">
                  <Link href="/videos">全ての動画を見る</Link>
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
