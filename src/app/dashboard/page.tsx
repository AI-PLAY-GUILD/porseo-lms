"use client";

import { useQuery } from "convex/react";
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


export default function DashboardPage() {
    const videos = useQuery(api.videos.getPublishedVideos);
    const stats = useQuery(api.dashboard.getStats);

    const chartConfig = {
        hours: {
            label: "学習時間 (時間)",
            color: "hsl(var(--chart-1))",
        },
    };

    if (videos === undefined || stats === undefined) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
            </div>
        );
    }

    // statsがnullの場合は未ログインかユーザーが存在しない（通常はmiddlewareで弾かれるが念のため）
    if (stats === null) {
        return <div>ユーザーデータの取得に失敗しました。</div>;
    }

    return (
        <SidebarProvider>
            <AppSidebar user={{ name: stats.userName, email: stats.userEmail, avatar: stats.userAvatar }} />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b w-full">
                    <div className="flex items-center gap-2">
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="#">学習プラットフォーム</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>ダッシュボード</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <div className="flex items-center justify-between space-y-2 py-4">
                        <h2 className="text-3xl font-bold tracking-tight">ダッシュボード</h2>
                        <div className="flex items-center space-x-2">
                            <Button asChild>
                                <Link href="/videos">学習を始める</Link>
                            </Button>
                        </div>
                    </div>

                    <Tabs defaultValue="overview" className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="overview">概要</TabsTrigger>
                            <TabsTrigger value="analytics" disabled>分析</TabsTrigger>
                            <TabsTrigger value="reports" disabled>レポート</TabsTrigger>
                        </TabsList>
                        <TabsContent value="overview" className="space-y-4">
                            {/* Stats Cards */}
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">総学習時間</CardTitle>
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {Math.floor(stats.totalMinutes / 60)}時間 {stats.totalMinutes % 60}分
                                        </div>
                                        <p className="text-xs text-muted-foreground">継続は力なり！</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">完了した動画</CardTitle>
                                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{stats.completedCount}本</div>
                                        <p className="text-xs text-muted-foreground">
                                            {videos.length > 0 ? `全コンテンツの ${Math.round((stats.completedCount / videos.length) * 100)}%` : "0%"}
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">現在のランク</CardTitle>
                                        <Trophy className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{stats.rank}</div>
                                        <p className="text-xs text-muted-foreground">次のランクまであと{stats.itemsToNext}本</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">連続学習記録</CardTitle>
                                        <Activity className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{stats.streakDays}</div>
                                        <p className="text-xs text-muted-foreground">日連続</p>
                                    </CardContent>
                                </Card>
                            </div>



                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                                {/* Chart Section */}
                                <Card className="col-span-4">
                                    <CardHeader>
                                        <CardTitle>学習の推移</CardTitle>
                                        <CardDescription>過去7日間の学習時間</CardDescription>
                                    </CardHeader>
                                    <CardContent className="pl-2">
                                        <ChartContainer config={chartConfig} className="h-[300px] w-full">
                                            <BarChart data={stats.chartData}>
                                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}時間`} />
                                                <ChartTooltip content={<ChartTooltipContent />} />
                                                <Bar dataKey="hours" fill="var(--color-hours)" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ChartContainer>
                                    </CardContent>
                                </Card>

                                {/* In-Progress Videos Section */}
                                <Card className="col-span-3">
                                    <CardHeader>
                                        <CardTitle>学習中のコンテンツ</CardTitle>
                                        <CardDescription>前回の続きから始めましょう</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {stats.inProgressVideos && stats.inProgressVideos.length > 0 ? (
                                                stats.inProgressVideos.slice(0, 3).map((video) => (
                                                    <Link href={`/videos/${video._id}`} key={video._id} className="flex flex-col gap-2 group hover:bg-muted/50 p-2 rounded-lg transition-colors">
                                                        <div className="flex items-center gap-4">
                                                            <div className="relative h-16 w-28 overflow-hidden rounded-md bg-muted shrink-0">
                                                                <img
                                                                    src={video.thumbnailUrl || `https://image.mux.com/${video.muxPlaybackId}/thumbnail.png?width=200&height=112&fit_mode=smart`}
                                                                    alt={video.title}
                                                                    className="h-full w-full object-cover"
                                                                />
                                                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <PlayCircle className="h-6 w-6 text-white" />
                                                                </div>
                                                            </div>
                                                            <div className="flex-1 space-y-1 min-w-0">
                                                                <p className="text-sm font-medium leading-none line-clamp-1 group-hover:text-primary transition-colors" title={video.title}>
                                                                    {video.title}
                                                                </p>
                                                                <div className="flex items-center text-xs text-muted-foreground">
                                                                    <Clock className="mr-1 h-3 w-3" />
                                                                    {new Date(video.lastWatchedAt).toLocaleDateString()}
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
                                                    <Button variant="link" asChild className="mt-2">
                                                        <Link href="/videos">動画一覧を見る</Link>
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Recommended Videos (Previously All Videos, now just Recommended or removed if not needed, but user asked to separate All Videos. I'll keep Recommended if it was there, but I replaced All Videos grid. I'll add a link to All Videos at the bottom) */}
                            <div className="mt-8 flex justify-center">
                                <Button asChild variant="outline" size="lg">
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
