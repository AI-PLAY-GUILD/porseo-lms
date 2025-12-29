"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlayCircle, Lock, BookOpen, Clock, Trophy, Activity } from "lucide-react";
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
  const videos = useQuery(api.videos.getPublishedVideos);
  const stats = useQuery(api.dashboard.getStats);

  const chartConfig = {
    hours: {
      label: "学習時間 (時間)",
      color: "var(--color-pop-purple)",
    },
  };

  if (videos === undefined || stats === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream">
        <BrutalistLoader />
      </div>
    );
  }

  const { user, isLoaded: isUserLoaded } = useUser();
  const syncUser = useMutation(api.users.syncCurrentUser);
  const [isSyncing, setIsSyncing] = useState(false);

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

  // statsがnullの場合は未ログインかユーザーが存在しない（通常はmiddlewareで弾かれるが念のため）
  if (stats === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream flex-col">
        <BrutalistLoader />
        <p className="mt-4 font-bold text-gray-500 animate-pulse">ユーザー情報を同期中...</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      {stats && <PaymentFailureDialog subscriptionStatus={stats.subscriptionStatus} />}
      <AppSidebar user={{ name: stats.userName, email: stats.userEmail, avatar: stats.userAvatar }} />
      <SidebarInset className="bg-cream">
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 w-full bg-cream px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="hover:bg-pop-yellow border-2 border-black rounded-md transition-colors" />
            <Separator orientation="vertical" className="mr-2 h-4 bg-black" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="#" className="font-bold text-gray-600 hover:text-black">学習プラットフォーム</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="text-black" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-black text-black">ダッシュボード</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-4xl font-black tracking-tight text-black">ダッシュボード</h2>
            <div className="flex items-center space-x-2">
              <Button asChild className="bg-pop-green text-black border-2 border-black brutal-shadow-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none font-bold rounded-lg">
                <Link href="/videos">学習を始める</Link>
              </Button>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-transparent gap-2 p-0 h-auto">
              <TabsTrigger value="overview" className="data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:brutal-shadow-sm border-2 border-black bg-white text-black font-bold rounded-lg px-4 py-2 h-auto transition-all">概要</TabsTrigger>
              <TabsTrigger value="analytics" disabled className="border-2 border-gray-300 bg-gray-100 text-gray-400 font-bold rounded-lg px-4 py-2 h-auto cursor-not-allowed opacity-50">分析</TabsTrigger>
              <TabsTrigger value="reports" disabled className="border-2 border-gray-300 bg-gray-100 text-gray-400 font-bold rounded-lg px-4 py-2 h-auto cursor-not-allowed opacity-50">レポート</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-white border-4 border-black brutal-shadow rounded-xl overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-pop-yellow/20 border-b-2 border-black">
                    <CardTitle className="text-sm font-black text-black uppercase tracking-wider">総学習時間</CardTitle>
                    <Clock className="h-5 w-5 text-black" />
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="text-3xl font-black text-black">
                      {Math.floor(stats.totalMinutes / 60)}<span className="text-lg font-bold text-gray-600 ml-1">時間</span> {stats.totalMinutes % 60}<span className="text-lg font-bold text-gray-600 ml-1">分</span>
                    </div>
                    <p className="text-xs font-bold text-gray-500 mt-1">継続は力なり！</p>
                  </CardContent>
                </Card>
                <Card className="bg-white border-4 border-black brutal-shadow rounded-xl overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-pop-green/20 border-b-2 border-black">
                    <CardTitle className="text-sm font-black text-black uppercase tracking-wider">完了した動画</CardTitle>
                    <BookOpen className="h-5 w-5 text-black" />
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="text-3xl font-black text-black">{stats.completedCount}<span className="text-lg font-bold text-gray-600 ml-1">本</span></div>
                    <p className="text-xs font-bold text-gray-500 mt-1">
                      {videos.length > 0 ? `全コンテンツの ${Math.round((stats.completedCount / videos.length) * 100)}%` : "0%"}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-white border-4 border-black brutal-shadow rounded-xl overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-pop-purple/20 border-b-2 border-black">
                    <CardTitle className="text-sm font-black text-black uppercase tracking-wider">現在のランク</CardTitle>
                    <Trophy className="h-5 w-5 text-black" />
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="text-3xl font-black text-black">{stats.rank}</div>
                    <p className="text-xs font-bold text-gray-500 mt-1">次のランクまであと{stats.itemsToNext}本</p>
                  </CardContent>
                </Card>
                <Card className="bg-white border-4 border-black brutal-shadow rounded-xl overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-pop-red/20 border-b-2 border-black">
                    <CardTitle className="text-sm font-black text-black uppercase tracking-wider">連続学習記録</CardTitle>
                    <Activity className="h-5 w-5 text-black" />
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="text-3xl font-black text-black">{stats.streakDays}</div>
                    <p className="text-xs font-bold text-gray-500 mt-1">日連続</p>
                  </CardContent>
                </Card>
              </div>



              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
                {/* Chart Section */}
                <Card className="col-span-1 md:col-span-2 lg:col-span-4 bg-white border-4 border-black brutal-shadow rounded-xl overflow-hidden">
                  <CardHeader className="border-b-2 border-black bg-gray-50">
                    <CardTitle className="font-black text-xl">学習の推移</CardTitle>
                    <CardDescription className="font-bold text-gray-500">過去7日間の学習時間</CardDescription>
                  </CardHeader>
                  <CardContent className="pl-2 pt-6">
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                      <BarChart data={stats.chartData}>
                        <XAxis dataKey="name" stroke="#000" fontSize={12} tickLine={false} axisLine={false} className="font-bold" />
                        <YAxis stroke="#000" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}時間`} className="font-bold" />
                        <ChartTooltip content={<ChartTooltipContent className="bg-white border-2 border-black brutal-shadow-sm font-bold" />} />
                        <Bar dataKey="hours" fill="var(--color-pop-purple)" radius={[4, 4, 0, 0]} stroke="#000" strokeWidth={2} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* In-Progress Videos Section */}
                <Card className="col-span-1 md:col-span-2 lg:col-span-3 bg-white border-4 border-black brutal-shadow rounded-xl overflow-hidden">
                  <CardHeader className="border-b-2 border-black bg-gray-50">
                    <CardTitle className="font-black text-xl">学習中のコンテンツ</CardTitle>
                    <CardDescription className="font-bold text-gray-500">前回の続きから始めましょう</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {stats.inProgressVideos && stats.inProgressVideos.length > 0 ? (
                        stats.inProgressVideos.slice(0, 3).map((video) => (
                          <Link href={`/videos/${video._id}`} key={video._id} className="flex flex-col gap-2 group hover:bg-pop-yellow/10 p-2 rounded-lg transition-colors border-2 border-transparent hover:border-black hover:brutal-shadow-sm">
                            <div className="flex items-center gap-4">
                              <div className="relative h-16 w-28 overflow-hidden rounded-md bg-muted shrink-0 border-2 border-black">
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
                                <p className="text-sm font-black leading-none line-clamp-1 group-hover:text-pop-purple transition-colors" title={video.title}>
                                  {video.title}
                                </p>
                                <div className="flex items-center text-xs font-bold text-gray-500">
                                  <Clock className="mr-1 h-3 w-3" />
                                  <span suppressHydrationWarning>
                                    {new Date(video.lastWatchedAt).toLocaleDateString("ja-JP")}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="w-full pl-1 pr-1">
                              <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                                <span>進捗</span>
                                <span>{video.progress}%</span>
                              </div>
                              <Progress value={video.progress} className="h-2 border border-black bg-gray-200 [&>div]:bg-pop-green" />
                            </div>
                          </Link>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <p className="text-sm font-bold">学習中の動画はありません</p>
                          <Button variant="link" asChild className="mt-2 font-black text-black hover:text-pop-purple">
                            <Link href="/videos">動画一覧を見る</Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-8 flex justify-center">
                <Button asChild size="lg" className="bg-white text-black border-2 border-black brutal-shadow font-bold hover:bg-gray-100 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
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
