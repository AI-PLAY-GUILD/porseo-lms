"use client";

import { useQuery } from "convex/react";
import { addDays } from "date-fns";
import { CheckCircle, Clock, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";
import { AnalyticsView } from "@/components/admin/analytics-view";
import { CalendarDateRangePicker } from "@/components/date-range-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "../../../convex/_generated/api";

export default function AdminDashboard() {
    const userData = useQuery(api.users.getUser);

    // Default to last 30 days
    const [date, setDate] = useState<DateRange | undefined>({
        from: addDays(new Date(), -30),
        to: new Date(),
    });

    const dateArgs =
        date?.from && date?.to
            ? {
                  startDate: date.from.getTime(),
                  endDate: date.to.getTime(),
              }
            : {};

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
        return <div className="p-8 font-bold">読み込み中...</div>;
    }

    if (!userData?.isAdmin) {
        return null;
    }

    return (
        <div className="flex-1 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-black">分析ダッシュボード</h2>
                <CalendarDateRangePicker date={date} setDate={setDate} />
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
                    <Card className="bg-white border-2 sm:border-4 border-black brutal-shadow rounded-xl overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2 sm:p-6 sm:pb-2 bg-pop-yellow/20 border-b-2 border-black">
                            <CardTitle className="text-xs sm:text-sm font-black text-black uppercase tracking-wider">
                                総ユーザー数
                            </CardTitle>
                            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-black" />
                        </CardHeader>
                        <CardContent className="p-3 pt-3 sm:p-6 sm:pt-4">
                            <div className="text-2xl sm:text-3xl font-black text-black">
                                {adminStats?.totalUsers ?? 0}
                            </div>
                            <p className="text-[10px] sm:text-xs font-bold text-gray-500 mt-1">登録済みユーザー</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-2 sm:border-4 border-black brutal-shadow rounded-xl overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2 sm:p-6 sm:pb-2 bg-pop-green/20 border-b-2 border-black">
                            <CardTitle className="text-xs sm:text-sm font-black text-black uppercase tracking-wider">
                                アクティブユーザー
                            </CardTitle>
                            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-black" />
                        </CardHeader>
                        <CardContent className="p-3 pt-3 sm:p-6 sm:pt-4">
                            <div className="text-2xl sm:text-3xl font-black text-black">
                                {adminStats?.activeUsers ?? 0}
                            </div>
                            <p className="text-[10px] sm:text-xs font-bold text-gray-500 mt-1">過去30日のアクティブ</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-2 sm:border-4 border-black brutal-shadow rounded-xl overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2 sm:p-6 sm:pb-2 bg-pop-purple/20 border-b-2 border-black">
                            <CardTitle className="text-xs sm:text-sm font-black text-black uppercase tracking-wider">
                                総視聴時間
                            </CardTitle>
                            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-black" />
                        </CardHeader>
                        <CardContent className="p-3 pt-3 sm:p-6 sm:pt-4">
                            <div className="text-2xl sm:text-3xl font-black text-black">
                                {adminStats?.totalWatchTimeHours ?? 0}
                                <span className="text-sm sm:text-lg font-bold text-gray-600 ml-1">時間</span>
                            </div>
                            <p className="text-[10px] sm:text-xs font-bold text-gray-500 mt-1">コンテンツ総消費時間</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-2 sm:border-4 border-black brutal-shadow rounded-xl overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2 sm:p-6 sm:pb-2 bg-pop-red/20 border-b-2 border-black">
                            <CardTitle className="text-xs sm:text-sm font-black text-black uppercase tracking-wider">
                                完了した動画
                            </CardTitle>
                            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-black" />
                        </CardHeader>
                        <CardContent className="p-3 pt-3 sm:p-6 sm:pt-4">
                            <div className="text-2xl sm:text-3xl font-black text-black">
                                {adminStats?.completedVideos ?? 0}
                            </div>
                            <p className="text-[10px] sm:text-xs font-bold text-gray-500 mt-1">動画完了総数</p>
                        </CardContent>
                    </Card>
                </div>

                {userGrowth && contentPerformance ? (
                    <AnalyticsView userGrowth={userGrowth} contentPerformance={contentPerformance} />
                ) : (
                    <div className="font-bold p-4">分析データを読み込み中...</div>
                )}
            </div>
        </div>
    );
}
