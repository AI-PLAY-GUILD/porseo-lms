"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { CalendarDateRangePicker } from "@/components/date-range-picker";
import { DateRange } from "react-day-picker";
import { addDays } from "date-fns";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function UserAnalyticsPage() {
    const userData = useQuery(api.users.getUser);
    const router = useRouter();

    // Default to last 30 days
    const [date, setDate] = useState<DateRange | undefined>({
        from: addDays(new Date(), -30),
        to: new Date(),
    });

    const dateArgs = date?.from && date?.to ? {
        startDate: date.from.getTime(),
        endDate: date.to.getTime(),
    } : {};

    const analytics = useQuery(api.admin.getUserBehaviorAnalytics, dateArgs);

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
                <h2 className="text-3xl font-bold tracking-tight">ユーザー行動分析</h2>
                <div className="flex items-center space-x-2">
                    <CalendarDateRangePicker date={date} setDate={setDate} />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>日次学習活動量</CardTitle>
                        <CardDescription>
                            全ユーザーの合計視聴時間（分）の推移
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        {analytics ? (
                            <ResponsiveContainer width="100%" height={350}>
                                <LineChart data={analytics.dailyActivity}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => {
                                            const date = new Date(value);
                                            return `${date.getMonth() + 1}/${date.getDate()}`;
                                        }}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `${value}分`}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        labelStyle={{ color: '#333' }}
                                        formatter={(value: number) => [`${value}分`, "視聴時間"]}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="minutes"
                                        stroke="#2563eb"
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 8 }}
                                        name="視聴時間"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                                データを読み込み中...
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>トップ学習者ランキング</CardTitle>
                        <CardDescription>
                            期間中の視聴時間が長いユーザー
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {analytics ? (
                            <div className="space-y-8">
                                {analytics.topLearners.length === 0 ? (
                                    <div className="text-center text-muted-foreground py-8">データがありません</div>
                                ) : (
                                    analytics.topLearners.map((learner, index) => (
                                        <div key={learner.userId} className="flex items-center">
                                            <div className="flex items-center justify-center w-8 font-bold text-muted-foreground mr-2">
                                                {index + 1}
                                            </div>
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={learner.imageUrl} alt="Avatar" />
                                                <AvatarFallback>{learner.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="ml-4 space-y-1">
                                                <p className="text-sm font-medium leading-none">{learner.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {learner.email}
                                                </p>
                                            </div>
                                            <div className="ml-auto font-medium">
                                                {Math.round(learner.minutesWatched / 60 * 10) / 10}時間
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                                データを読み込み中...
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
                <Card className="col-span-7">
                    <CardHeader>
                        <CardTitle>人気コンテンツ</CardTitle>
                        <CardDescription>
                            視聴回数と完了率が高い動画
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <PopularContentTable dateArgs={dateArgs} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function PopularContentTable({ dateArgs }: { dateArgs: any }) {
    const contentPerformance = useQuery(api.admin.getContentPerformance, dateArgs);

    if (!contentPerformance) {
        return <div>読み込み中...</div>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b dark:border-gray-700">
                        <th className="py-3 px-4">タイトル</th>
                        <th className="py-3 px-4">視聴回数</th>
                        <th className="py-3 px-4">完了数</th>
                        <th className="py-3 px-4">平均完了率</th>
                    </tr>
                </thead>
                <tbody>
                    {contentPerformance.map((content) => (
                        <tr key={content.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="py-3 px-4 font-medium">{content.title}</td>
                            <td className="py-3 px-4">{content.views}</td>
                            <td className="py-3 px-4">{content.completions}</td>
                            <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 max-w-[100px]">
                                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${content.avgCompletionRate}%` }}></div>
                                    </div>
                                    <span className="text-sm text-gray-500">{content.avgCompletionRate}%</span>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

