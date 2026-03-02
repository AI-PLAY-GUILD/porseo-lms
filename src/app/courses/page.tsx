"use client";

import { SignOutButton, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { BookOpen, Clock, LogOut, Video } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { Badge } from "@/components/ui/badge";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { BrutalistLoader } from "@/components/ui/brutalist-loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { api } from "../../../convex/_generated/api";

export default function CoursesPage() {
    const router = useRouter();
    const courses = useQuery(api.courses.getPublishedCourses);
    const stats = useQuery(api.dashboard.getStats);
    const { user } = useUser();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isMounted && stats) {
            const status = stats.subscriptionStatus;
            if (status !== "active" && status !== "past_due") {
                router.push("/join");
            }
        }
    }, [isMounted, stats, router]);

    if (!isMounted || courses === undefined) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-cream">
                <BrutalistLoader />
            </div>
        );
    }

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}時間${m}分`;
        return `${m}分`;
    };

    return (
        <SidebarProvider>
            <AppSidebar
                user={
                    stats
                        ? {
                              name: stats.userName,
                              email: user?.emailAddresses?.[0]?.emailAddress,
                              avatar: stats.userAvatar,
                          }
                        : undefined
                }
            />
            <SidebarInset className="bg-cream">
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 w-full bg-cream px-4">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="hover:bg-pop-yellow border-2 border-black rounded-md transition-colors text-black" />
                        <Separator orientation="vertical" className="mr-2 h-4 bg-black" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="font-bold text-gray-600">ナレッジ</BreadcrumbPage>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="text-black" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="font-black text-black">コース</BreadcrumbPage>
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
                <div className="flex flex-1 flex-col gap-8 p-6">
                    <div className="space-y-4">
                        <h2 className="text-3xl font-black tracking-tight text-black">コース</h2>

                        {courses.length === 0 ? (
                            <div className="text-center py-16">
                                <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-500 font-bold">コースはまだありません。</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {courses.map((course) => (
                                    <Link
                                        href={`/courses/${course._id}`}
                                        key={course._id}
                                        className="group block h-full"
                                    >
                                        <Card className="h-full overflow-hidden hover:shadow-none transition-all duration-300 hover:translate-x-1 hover:translate-y-1 border-4 border-black bg-white brutal-shadow rounded-xl">
                                            <div className="aspect-video bg-gradient-to-br from-pop-purple to-pop-red relative overflow-hidden border-b-4 border-black flex items-center justify-center">
                                                <BookOpen className="w-16 h-16 text-white/80 group-hover:scale-110 transition-transform duration-500" />
                                                <div className="absolute top-2 right-2 z-10">
                                                    <Badge className="bg-pop-yellow text-black border-2 border-black shadow-sm font-bold rounded-md">
                                                        <Video className="w-3 h-3 mr-1" />
                                                        {course.videoCount}本
                                                    </Badge>
                                                </div>
                                            </div>
                                            <CardHeader className="p-4 pb-2">
                                                <CardTitle
                                                    className="line-clamp-2 text-lg font-black text-black group-hover:text-pop-purple transition-colors duration-300 leading-tight"
                                                    title={course.title}
                                                >
                                                    {course.title}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-4 pt-0">
                                                {course.description && (
                                                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                                        {course.description}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-3 text-xs font-bold text-gray-500 mt-2">
                                                    {course.totalDuration > 0 && (
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {formatDuration(course.totalDuration)}
                                                        </span>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
