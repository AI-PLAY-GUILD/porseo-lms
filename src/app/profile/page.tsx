"use client";

import { SignOutButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { Clock, CreditCard, LogOut, Mail, Settings, Shield, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { api } from "../../../convex/_generated/api";

export default function ProfilePage() {
    const userData = useQuery(api.users.getUser);
    const trialStatus = useQuery(api.notePromo.getTrialStatus);
    const [loading, setLoading] = useState(false);
    const [noActiveSubscription, setNoActiveSubscription] = useState(false);

    console.log(
        "[ProfilePage] レンダリング userData:",
        userData === undefined ? "loading" : userData === null ? "null" : "loaded",
    );

    const handleManageSubscription = async () => {
        console.log("[ProfilePage] サブスクリプション管理開始");
        setLoading(true);
        setNoActiveSubscription(false);
        try {
            const res = await fetch("/api/create-portal-session", {
                method: "POST",
            });
            const data = await res.json();
            if (!res.ok) {
                if (data?.error === "NO_ACTIVE_SUBSCRIPTION") {
                    setNoActiveSubscription(true);
                    return;
                }
                const message = data?.message || data?.error || `HTTP ${res.status}`;
                alert(`カスタマーポータルのURL取得に失敗しました。\n${message}`);
                return;
            }
            console.log("[ProfilePage] ポータルセッション取得結果:", { hasUrl: !!data.url });
            if (data.url) {
                console.log("[ProfilePage] ポータルURLへリダイレクト");
                window.location.href = data.url;
            } else {
                alert("カスタマーポータルのURL取得に失敗しました。");
            }
        } catch (error) {
            console.error("[ProfilePage] エラー: ポータルリダイレクト失敗:", error);
            console.error("Failed to redirect to portal:", error);
            alert("エラーが発生しました。");
        } finally {
            setLoading(false);
        }
    };

    if (userData === undefined) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <BrutalistLoader />
            </div>
        );
    }

    if (userData === null) {
        return <div>ユーザー情報の取得に失敗しました。</div>;
    }

    const isPremium = userData.subscriptionStatus === "active";
    const isNoteTrial = userData.subscriptionStatus === "note_trial";

    return (
        <SidebarProvider>
            <AppSidebar user={{ name: userData.name, email: userData.email, avatar: userData.imageUrl }} />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 w-full px-4">
                    <div className="flex items-center gap-2">
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/dashboard">ダッシュボード</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>プロフィール</BreadcrumbPage>
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
                <div className="flex flex-1 flex-col gap-8 p-8 max-w-4xl mx-auto w-full">
                    {/* Header Section */}
                    <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                        <Avatar className="h-24 w-24 border-4 border-muted">
                            <AvatarImage src={userData.imageUrl} alt={userData.name} />
                            <AvatarFallback className="text-2xl">
                                {userData.name?.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                            <h1 className="text-3xl font-bold">{userData.name}</h1>
                            <div className="flex items-center justify-center sm:justify-start gap-2 text-muted-foreground">
                                <Mail className="w-4 h-4" />
                                <span>{userData.email}</span>
                            </div>
                            <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                                {userData.isAdmin && (
                                    <Badge variant="secondary" className="gap-1">
                                        <Shield className="w-3 h-3" />
                                        管理者
                                    </Badge>
                                )}
                                <Badge
                                    variant={isPremium || isNoteTrial ? "default" : "outline"}
                                    className={
                                        isPremium
                                            ? "bg-gradient-to-r from-blue-600 to-violet-600 border-0"
                                            : isNoteTrial
                                              ? "bg-gradient-to-r from-sky-400 to-cyan-500 border-0"
                                              : ""
                                    }
                                >
                                    {isPremium ? "プレミアム会員" : isNoteTrial ? "無料トライアル" : "無料会員"}
                                </Badge>
                            </div>
                            {userData.isAdmin && (
                                <div className="mt-3">
                                    <Button
                                        asChild
                                        size="sm"
                                        className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                                    >
                                        <Link href="/admin">
                                            <Settings className="w-4 h-4" />
                                            管理ページへ遷移
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Subscription Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="w-5 h-5" />
                                サブスクリプション管理
                            </CardTitle>
                            <CardDescription>
                                現在の契約状況の確認や、お支払い方法の変更・解約ができます。
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                                <div>
                                    <p className="font-medium">現在のプラン</p>
                                    <p className="text-sm text-muted-foreground">
                                        {isPremium
                                            ? userData.subscriptionName || "プレミアムプラン"
                                            : isNoteTrial
                                              ? `noteマガジン無料トライアル${trialStatus ? ` (残り${trialStatus.daysRemaining}日)` : ""}`
                                              : "フリープラン"}
                                    </p>
                                </div>
                                <Badge
                                    variant={isPremium || isNoteTrial ? "default" : "secondary"}
                                    className={isNoteTrial ? "bg-sky-500" : ""}
                                >
                                    {isPremium ? "有効" : isNoteTrial ? "トライアル中" : "未契約"}
                                </Badge>
                            </div>

                            {isNoteTrial ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm text-sky-700 bg-sky-50 border border-sky-200 rounded-lg p-3">
                                        <Clock className="w-4 h-4 flex-shrink-0" />
                                        <p>
                                            無料体験期間中です。
                                            {trialStatus && (
                                                <span className="font-bold">あと{trialStatus.daysRemaining}日</span>
                                            )}
                                            で終了します。
                                        </p>
                                    </div>
                                    <Button asChild className="bg-gradient-to-r from-blue-600 to-violet-600">
                                        <Link href="/join">有料メンバーになる</Link>
                                    </Button>
                                </div>
                            ) : isPremium ? (
                                userData.stripeCustomerId ? (
                                    noActiveSubscription ? (
                                        <div className="space-y-4">
                                            <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-md text-sm text-yellow-800">
                                                <p className="font-bold mb-2">
                                                    Stripeにアクティブなサブスクリプションが見つかりませんでした
                                                </p>
                                                <p className="mb-2">
                                                    このアカウントはStripe以外の方法でプレミアム権限が付与されているか、サブスクリプションがすでに解約されています。解約や変更をご希望の場合は、お手数ですが運営までお問い合わせください。
                                                </p>
                                                <p>
                                                    お問い合わせ先:{" "}
                                                    <a
                                                        href="mailto:taiyo.kimura.3w@stu.hosei.ac.jp"
                                                        className="underline text-blue-600 hover:text-blue-800"
                                                    >
                                                        taiyo.kimura.3w@stu.hosei.ac.jp
                                                    </a>
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <Button
                                                onClick={handleManageSubscription}
                                                disabled={loading}
                                                className="w-full sm:w-auto"
                                            >
                                                {loading ? "読み込み中..." : "契約内容の確認・変更・解約"}
                                            </Button>
                                            <p className="text-xs text-muted-foreground">
                                                ※ Stripeの安全な管理画面へ移動します。
                                            </p>
                                        </div>
                                    )
                                ) : (
                                    <div className="space-y-4">
                                        <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-md text-sm text-yellow-800">
                                            <p className="font-bold mb-2">旧システムでご契約のお客様へ</p>
                                            <p className="mb-2">お手数ですが、以下の手順で解約をお願いいたします。</p>
                                            <ol className="list-decimal list-inside space-y-1 ml-2">
                                                <li>
                                                    <a
                                                        href="https://www.ai-porseo.com/"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="underline text-blue-600 hover:text-blue-800"
                                                    >
                                                        https://www.ai-porseo.com/
                                                    </a>
                                                    にアクセスしてログイン
                                                </li>
                                                <li>マイページ ＞ コミュニティ契約一覧 を選択</li>
                                                <li>該当の契約をクリックし「キャンセルする」ボタンを押す</li>
                                            </ol>
                                        </div>
                                    </div>
                                )
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-sm text-muted-foreground">
                                        プレミアムプランに参加して、全てのコンテンツにアクセスしましょう。
                                    </p>
                                    <Button asChild className="bg-gradient-to-r from-blue-600 to-violet-600">
                                        <a href="/">プランに加入する</a>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Account Info Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="w-5 h-5" />
                                アカウント情報
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">ユーザー名</label>
                                    <p className="text-sm font-medium">{userData.name}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">メールアドレス</label>
                                    <p className="text-sm font-medium">{userData.email}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Discord連携</label>
                                    <p className="text-sm font-medium">{userData.discordId ? "連携済み" : "未連携"}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">会員ID</label>
                                    <p className="text-xs font-mono text-muted-foreground">{userData._id}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
