"use client";

import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Legend,
    LabelList,
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
    const topContent = contentPerformance
        .filter(item => item.views > 0)
        .slice(0, 5);

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>ユーザー増加数 (過去30日)</CardTitle>
                    <CardDescription>
                        期間中の新規ユーザー登録推移
                    </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={userGrowth}>
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
                                allowDecimals={false}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                labelStyle={{ color: '#333' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="count"
                                stroke="#8884d8"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 8 }}
                                name="新規ユーザー"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="col-span-3">
                <CardHeader>
                    <CardTitle>人気コンテンツ</CardTitle>
                    <CardDescription>
                        視聴回数と完了率の上位動画
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={topContent} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                            <XAxis
                                type="number"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                allowDecimals={false}
                            />
                            <YAxis
                                dataKey="title"
                                type="category"
                                width={100}
                                tick={{ fontSize: 11 }}
                                tickFormatter={(value) => value.length > 10 ? `${value.substring(0, 10)}...` : value}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend />
                            <Bar dataKey="views" fill="#adfa1d" radius={[0, 4, 4, 0]} name="視聴回数" barSize={20}>
                                <LabelList
                                    dataKey="views"
                                    position="right"
                                    fontSize={10}
                                    formatter={(value: number) => value > 0 ? value : ""}
                                />
                            </Bar>
                            <Bar dataKey="completions" fill="#2563eb" radius={[0, 4, 4, 0]} name="完了数" barSize={20}>
                                <LabelList
                                    dataKey="completions"
                                    position="right"
                                    fontSize={10}
                                    formatter={(value: number) => value > 0 ? value : ""}
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
