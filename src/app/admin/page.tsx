"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDateRangePicker } from "@/components/date-range-picker";
import { Users, Clock, CheckCircle } from "lucide-react";
import { AnalyticsView } from "@/components/admin/analytics-view";

import { useState } from "react";
import { DateRange } from "react-day-picker";
import { addDays } from "date-fns";

export default function AdminDashboard() {
    const userData = useQuery(api.users.getUser);

    // Default to last 30 days
    const [date, setDate] = useState<DateRange | undefined>({
        from: addDays(new Date(), -30),
        to: new Date(),
    });

    const dateArgs = date?.from && date?.to ? {
        startDate: date.from.getTime(),
        endDate: date.to.getTime(),
    } : {};

    const adminStats = useQuery(api.admin.getAdminStats, dateArgs);
    const userGrowth = useQuery(api.admin.getUserGrowth, dateArgs);
    const contentPerformance = useQuery(api.admin.getContentPerformance, dateArgs);
    const router = useRouter();

    useEffect(() => {
        if (userData !== undefined && !userData?.isAdmin) {
            router.push("/");
        }
    }, [userData, router]);

    if (userData === undefined) {
        return <div className="p-8">読み込み中...</div>;
    }

    if (!userData?.isAdmin) {
        return null;
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">分析ダッシュボード</h2>
                <div className="flex items-center space-x-2">
                    <CalendarDateRangePicker date={date} setDate={setDate} />
                </div>
            </div>

            <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                総ユーザー数
                            </CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{adminStats?.totalUsers ?? 0}</div>
                            <p className="text-xs text-muted-foreground">
                                登録済みユーザー
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                アクティブユーザー (30日)
                            </CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{adminStats?.activeUsers ?? 0}</div>
                            <p className="text-xs text-muted-foreground">
                                過去30日のアクティブ
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">総視聴時間</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{adminStats?.totalWatchTimeHours ?? 0}時間</div>
                            <p className="text-xs text-muted-foreground">
                                コンテンツ総消費時間
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                完了した動画
                            </CardTitle>
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{adminStats?.completedVideos ?? 0}</div>
                            <p className="text-xs text-muted-foreground">
                                動画完了総数
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {userGrowth && contentPerformance ? (
                    <AnalyticsView
                        userGrowth={userGrowth}
                        contentPerformance={contentPerformance}
                    />
                ) : (
                    <div>分析データを読み込み中...</div>
                )}
            </div>
        </div>
    );
}

