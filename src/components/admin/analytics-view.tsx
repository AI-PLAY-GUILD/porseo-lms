"use client";

import {
    Bar,
    BarChart,
    LabelList,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface UserGrowthData {
    date: string;
    count: number;
}

interface ContentPerformanceData {
    id: string;
    title: string;
    views: number;
    completions: number;
    avgCompletionRate: number;
}

interface AnalyticsViewProps {
    userGrowth: UserGrowthData[];
    contentPerformance: ContentPerformanceData[];
}

export function AnalyticsView({ userGrowth, contentPerformance }: AnalyticsViewProps) {
    // Filter out videos with 0 views and take top 5
    const topContent = contentPerformance.filter((item) => item.views > 0).slice(0, 5);

    return (
        <div className="grid gap-3 sm:gap-4 lg:grid-cols-7">
            <Card className="lg:col-span-4">
                <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-sm sm:text-base">ユーザー増加数 (過去30日)</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">期間中の新規ユーザー登録推移</CardDescription>
                </CardHeader>
                <CardContent className="p-2 sm:pl-2 sm:p-6 sm:pt-0">
                    <div className="h-[220px] sm:h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={userGrowth}>
                                <XAxis
                                    dataKey="date"
                                    stroke="#888888"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => {
                                        const date = new Date(value);
                                        return `${date.getMonth() + 1}/${date.getDate()}`;
                                    }}
                                />
                                <YAxis
                                    stroke="#888888"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    allowDecimals={false}
                                    width={30}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "rgba(255, 255, 255, 0.8)",
                                        borderRadius: "8px",
                                        border: "none",
                                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                    }}
                                    labelStyle={{ color: "#333" }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#8884d8"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 6 }}
                                    name="新規ユーザー"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card className="lg:col-span-3">
                <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-sm sm:text-base">人気コンテンツ</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">視聴回数と完了率の上位動画</CardDescription>
                </CardHeader>
                <CardContent className="p-2 sm:p-6 sm:pt-0">
                    <div className="h-[220px] sm:h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={topContent}
                                layout="vertical"
                                margin={{ left: 0, right: 20, top: 0, bottom: 0 }}
                            >
                                <XAxis
                                    type="number"
                                    stroke="#888888"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    allowDecimals={false}
                                />
                                <YAxis
                                    dataKey="title"
                                    type="category"
                                    width={80}
                                    tick={{ fontSize: 10 }}
                                    tickFormatter={(value) =>
                                        value.length > 8 ? `${value.substring(0, 8)}...` : value
                                    }
                                />
                                <Tooltip
                                    cursor={{ fill: "transparent" }}
                                    contentStyle={{
                                        backgroundColor: "rgba(255, 255, 255, 0.8)",
                                        borderRadius: "8px",
                                        border: "none",
                                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                    }}
                                />
                                <Legend wrapperStyle={{ fontSize: "12px" }} />
                                <Bar dataKey="views" fill="#adfa1d" radius={[0, 4, 4, 0]} name="視聴回数" barSize={16}>
                                    <LabelList
                                        dataKey="views"
                                        position="right"
                                        fontSize={10}
                                        formatter={(value: number) => (value > 0 ? value : "")}
                                    />
                                </Bar>
                                <Bar
                                    dataKey="completions"
                                    fill="#2563eb"
                                    radius={[0, 4, 4, 0]}
                                    name="完了数"
                                    barSize={16}
                                >
                                    <LabelList
                                        dataKey="completions"
                                        position="right"
                                        fontSize={10}
                                        formatter={(value: number) => (value > 0 ? value : "")}
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
