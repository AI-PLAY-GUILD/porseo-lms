"use client";

import { SignOutButton, useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { Activity, AlertCircle, BookOpen, Clock, LogOut, PlayCircle, Trophy } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { AppSidebar } from "@/components/app-sidebar";
import { PaymentFailureDialog } from "@/components/payment-failure-dialog";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "../../../convex/_generated/api";

function DashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const videos = useQuery(api.videos.getPublishedVideos);
    const stats = useQuery(api.dashboard.getStats);

    const { user, isLoaded: isUserLoaded } = useUser();
    const syncUser = useMutation(api.users.syncCurrentUser);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const discordCheckRan = useRef(false);

    const chartConfig = {
        hours: {
            label: "学習時間 (時間)",
            color: "var(--color-pop-purple)",
        },
    };

    useEffect(() => {
        console.log("[DashboardPage] マウント/初期化");
        setIsMounted(true);
    }, []);

    useEffect(() => {
        console.log(
            "[DashboardPage] useEffect(sync) stats:",
            stats === null ? "null" : stats === undefined ? "undefined" : "loaded",
            "isUserLoaded:",
            isUserLoaded,
            "isSyncing:",
            isSyncing,
        );
        const sync = async () => {
            if (stats === null && isUserLoaded && user && !isSyncing) {
                console.log("[DashboardPage] ユーザー同期開始");
                setIsSyncing(true);
                try {
                    await syncUser();
                    console.log("[DashboardPage] ユーザー同期完了");
                } catch (error) {
                    console.error("[DashboardPage] エラー: ユーザー同期失敗:", error);
                    console.error("Failed to sync user:", error);
                } finally {
                    setIsSyncing(false);
                }
            }
        };
        sync();
    }, [stats, isUserLoaded, user, isSyncing, syncUser]);

    // Discord role-based activation: runs once when arriving via stripe_link=1
    useEffect(() => {
        if (!isMounted || !isUserLoaded || !user || discordCheckRan.current) return;
        if (searchParams.get("stripe_link") !== "1") return;

        discordCheckRan.current = true;
        const checkDiscordRole = async () => {
            console.log("[DashboardPage] 既存アカウント連携: Discordロールチェック開始");
            try {
                const res = await fetch("/api/activate-by-discord-role", { method: "POST" });
                const data = await res.json();
                if (data.status === "active") {
                    toast.success("✅ Discordロールを確認しました。LMSへようこそ！");
                    router.replace("/dashboard");
                } else if (data.status === "no_role") {
                    toast.error("❌ 対象のDiscordロールが確認できませんでした。");
                } else if (data.status === "not_in_server") {
                    toast.error("❌ 対象のDiscordサーバーに参加していません。");
                } else {
                    console.log("[DashboardPage] 既存アカウント連携: アクティベーション失敗", data);
                }
            } catch (e) {
                console.error("[DashboardPage] 既存アカウント連携: Discordロールチェック失敗", e);
            }
        };
        checkDiscordRole();
    }, [isMounted, isUserLoaded, user, searchParams, router]);

    // Gatekeeper: Redirect if not active and not past_due
    useEffect(() => {
        if (isMounted && stats) {
            const status = stats.subscriptionStatus;
            console.log("[DashboardPage] ゲートキーパー確認 subscriptionStatus:", status);

            const isLinkFlow = searchParams.get("stripe_link") === "1";
            const isPaymentSuccess = searchParams.get("payment") === "success";

            // If payment just succeeded, show a toast and wait a bit for the webhook if status isn't active yet
            if (isPaymentSuccess && status !== "active") {
                toast.info("決済を確認中です... 少々お待ちください。", { id: "payment-processing" });
                // We don't redirect to /join immediately if payment=success is present
                return;
            }

            if (isPaymentSuccess && status === "active") {
                toast.success("✅ 決済が完了しました！メンバーシップへようこそ。", { id: "payment-success" });
                // Remove the query param to clean up the URL
                router.replace("/dashboard");
                return;
            }

            // If stripe_link=1 is present, skip redirect for a moment (let Discord check run first)
            if (status !== "active" && status !== "past_due" && !isLinkFlow && !isPaymentSuccess) {
                console.log("[DashboardPage] アクティブでないため /join へリダイレクト");
                router.push("/join");
            }
        }
    }, [isMounted, stats, router, searchParams]);

    if (!isMounted) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-cream">
                <BrutalistLoader />
            </div>
        );
    }

    // statsがnullの場合は未ログインかユーザーが存在しない（通常はmiddlewareで弾かれるが念のため）
    if (stats === null) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-cream flex-col">
                <BrutalistLoader />
                <p className="mt-4 font-bold text-gray-500 animate-pulse">ユーザー情報を同期中...</p>
            </div>
        );
    }

    if (videos === undefined || stats === undefined) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-cream">
                <BrutalistLoader />
            </div>
        );
    }

    const discordAccount = user?.externalAccounts.find(
        (acc) => (acc.provider as string) === "oauth_discord" || (acc.provider as string) === "discord",
    );
    const hasDiscord = !!discordAccount;

    const handleConnectDiscord = async () => {
        if (!user) return;
        try {
            await user.createExternalAccount({
                strategy: "oauth_discord",
                redirectUrl: "/sso-callback",
            });
        } catch (error) {
            console.error("Failed to connect Discord:", error);
            toast.error("Discordへの連携に失敗しました。");
        }
    };

    return (
        <SidebarProvider>
            {stats && <PaymentFailureDialog subscriptionStatus={stats.subscriptionStatus} />}
            <AppSidebar
                user={{
                    name: stats.userName,
                    email: user?.emailAddresses?.[0]?.emailAddress,
                    avatar: stats.userAvatar,
                }}
            />
            <SidebarInset className="bg-cream">
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 w-full bg-cream px-4">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="hover:bg-pop-yellow border-2 border-black rounded-md transition-colors" />
                        <Separator orientation="vertical" className="mr-2 h-4 bg-black" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="#" className="font-bold text-gray-600 hover:text-black">
                                        学習プラットフォーム
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="text-black" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="font-black text-black">ダッシュボード</BreadcrumbPage>
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
                <div className="flex flex-1 flex-col gap-6 p-6 pt-6">
                    {!hasDiscord && (
                        <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-900 p-4 mb-4 rounded-md shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="h-6 w-6 text-amber-500 flex-shrink-0" />
                                <div>
                                    <h3 className="font-bold text-lg">Discord連携が必要です</h3>
                                    <p className="text-sm">
                                        コミュニティへの参加や、メンバー限定コンテンツの視聴にはDiscordアカウントの連携が必要です。
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={handleConnectDiscord}
                                className="bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold whitespace-nowrap"
                            >
                                Discordと連携する
                            </Button>
                        </div>
                    )}

                    <div className="flex items-center justify-between space-y-2">
                        <h2 className="text-4xl font-black tracking-tight text-black">ダッシュボード</h2>
                        <div className="flex items-center space-x-2">
                            <Button
                                asChild
                                className="bg-pop-green text-black border-2 border-black brutal-shadow-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none font-bold rounded-lg"
                            >
                                <Link href="/videos">学習を始める</Link>
                            </Button>
                        </div>
                    </div>

                    <Tabs defaultValue="overview" className="space-y-6">
                        <TabsList className="bg-transparent gap-2 p-0 h-auto">
                            <TabsTrigger
                                value="overview"
                                className="data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:brutal-shadow-sm border-2 border-black bg-white text-black font-bold rounded-lg px-4 py-2 h-auto transition-all"
                            >
                                概要
                            </TabsTrigger>
                            <TabsTrigger
                                value="analytics"
                                disabled
                                className="border-2 border-gray-300 bg-gray-100 text-gray-400 font-bold rounded-lg px-4 py-2 h-auto cursor-not-allowed opacity-50"
                            >
                                分析
                            </TabsTrigger>
                            <TabsTrigger
                                value="reports"
                                disabled
                                className="border-2 border-gray-300 bg-gray-100 text-gray-400 font-bold rounded-lg px-4 py-2 h-auto cursor-not-allowed opacity-50"
                            >
                                レポート
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="overview" className="space-y-6">
                            {/* Stats Cards */}
                            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                                <Card className="bg-white border-4 border-black brutal-shadow rounded-xl overflow-hidden">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-pop-yellow/20 border-b-2 border-black">
                                        <CardTitle className="text-sm font-black text-black uppercase tracking-wider">
                                            総学習時間
                                        </CardTitle>
                                        <Clock className="h-5 w-5 text-black" />
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        <div className="text-3xl font-black text-black">
                                            {Math.floor(stats.totalMinutes / 60)}
                                            <span className="text-lg font-bold text-gray-600 ml-1">時間</span>{" "}
                                            {stats.totalMinutes % 60}
                                            <span className="text-lg font-bold text-gray-600 ml-1">分</span>
                                        </div>
                                        <p className="text-xs font-bold text-gray-500 mt-1">継続は力なり！</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-white border-4 border-black brutal-shadow rounded-xl overflow-hidden">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-pop-green/20 border-b-2 border-black">
                                        <CardTitle className="text-sm font-black text-black uppercase tracking-wider">
                                            完了した動画
                                        </CardTitle>
                                        <BookOpen className="h-5 w-5 text-black" />
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        <div className="text-3xl font-black text-black">
                                            {stats.completedCount}
                                            <span className="text-lg font-bold text-gray-600 ml-1">本</span>
                                        </div>
                                        <p className="text-xs font-bold text-gray-500 mt-1">
                                            {videos.length > 0
                                                ? `全コンテンツの ${Math.round((stats.completedCount / videos.length) * 100)}%`
                                                : "0%"}
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-white border-4 border-black brutal-shadow rounded-xl overflow-hidden">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-pop-purple/20 border-b-2 border-black">
                                        <CardTitle className="text-sm font-black text-black uppercase tracking-wider">
                                            現在のランク
                                        </CardTitle>
                                        <Trophy className="h-5 w-5 text-black" />
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        <div className="text-3xl font-black text-black">{stats.rank}</div>
                                        <p className="text-xs font-bold text-gray-500 mt-1">
                                            次のランクまであと{stats.itemsToNext}本
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-white border-4 border-black brutal-shadow rounded-xl overflow-hidden">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-pop-red/20 border-b-2 border-black">
                                        <CardTitle className="text-sm font-black text-black uppercase tracking-wider">
                                            連続学習記録
                                        </CardTitle>
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
                                        <CardDescription className="font-bold text-gray-500">
                                            過去7日間の学習時間
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pl-2 pt-6">
                                        <ChartContainer config={chartConfig} className="h-[300px] w-full">
                                            <BarChart data={stats.chartData}>
                                                <XAxis
                                                    dataKey="name"
                                                    stroke="#000"
                                                    fontSize={12}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    className="font-bold"
                                                />
                                                <YAxis
                                                    stroke="#000"
                                                    fontSize={12}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tickFormatter={(value) => `${value}時間`}
                                                    className="font-bold"
                                                />
                                                <ChartTooltip
                                                    content={
                                                        <ChartTooltipContent className="bg-white border-2 border-black brutal-shadow-sm font-bold" />
                                                    }
                                                />
                                                <Bar
                                                    dataKey="hours"
                                                    fill="var(--color-pop-purple)"
                                                    radius={[4, 4, 0, 0]}
                                                    stroke="#000"
                                                    strokeWidth={2}
                                                />
                                            </BarChart>
                                        </ChartContainer>
                                    </CardContent>
                                </Card>

                                {/* In-Progress Videos Section */}
                                <Card className="col-span-1 md:col-span-2 lg:col-span-3 bg-white border-4 border-black brutal-shadow rounded-xl overflow-hidden">
                                    <CardHeader className="border-b-2 border-black bg-gray-50">
                                        <CardTitle className="font-black text-xl">学習中のコンテンツ</CardTitle>
                                        <CardDescription className="font-bold text-gray-500">
                                            前回の続きから始めましょう
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        <div className="space-y-4">
                                            {stats.inProgressVideos && stats.inProgressVideos.length > 0 ? (
                                                stats.inProgressVideos.slice(0, 3).map((video) => (
                                                    <Link
                                                        href={`/videos/${video._id}`}
                                                        key={video._id}
                                                        className="flex flex-col gap-2 group hover:bg-pop-yellow/10 p-2 rounded-lg transition-colors border-2 border-transparent hover:border-black hover:brutal-shadow-sm"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="relative h-16 w-28 overflow-hidden rounded-md bg-muted shrink-0 border-2 border-black">
                                                                <img
                                                                    src={
                                                                        video.thumbnailUrl ||
                                                                        `https://image.mux.com/${video.muxPlaybackId}/thumbnail.png?width=200&height=112&fit_mode=smart`
                                                                    }
                                                                    alt={video.title}
                                                                    className="h-full w-full object-cover"
                                                                />
                                                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <PlayCircle className="h-6 w-6 text-white drop-shadow-md" />
                                                                </div>
                                                            </div>
                                                            <div className="flex-1 space-y-1 min-w-0">
                                                                <p
                                                                    className="text-sm font-black leading-none line-clamp-1 group-hover:text-pop-purple transition-colors"
                                                                    title={video.title}
                                                                >
                                                                    {video.title}
                                                                </p>
                                                                <div className="flex items-center text-xs font-bold text-gray-500">
                                                                    <Clock className="mr-1 h-3 w-3" />
                                                                    <span suppressHydrationWarning>
                                                                        {new Date(
                                                                            video.lastWatchedAt,
                                                                        ).toLocaleDateString("ja-JP")}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="w-full pl-1 pr-1">
                                                            <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                                                                <span>進捗</span>
                                                                <span>{video.progress}%</span>
                                                            </div>
                                                            <Progress
                                                                value={video.progress}
                                                                className="h-2 border border-black bg-gray-200 [&>div]:bg-pop-green"
                                                            />
                                                        </div>
                                                    </Link>
                                                ))
                                            ) : (
                                                <div className="text-center py-8 text-gray-500">
                                                    <p className="text-sm font-bold">学習中の動画はありません</p>
                                                    <Button
                                                        variant="link"
                                                        asChild
                                                        className="mt-2 font-black text-black hover:text-pop-purple"
                                                    >
                                                        <Link href="/videos">動画一覧を見る</Link>
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="mt-8 flex justify-center">
                                <Button
                                    asChild
                                    size="lg"
                                    className="bg-white text-black border-2 border-black brutal-shadow font-bold hover:bg-gray-100 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                                >
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

export default function DashboardPage() {
    return (
        <Suspense>
            <DashboardContent />
        </Suspense>
    );
}
