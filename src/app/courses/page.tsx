"use client";

import { SignOutButton, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { BookOpen, Clock, Lock, LogOut, Search, Video, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
                    <CourseListSection courses={courses} formatDuration={formatDuration} />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}

function CourseListSection({
    courses,
    formatDuration,
}: {
    // biome-ignore lint/suspicious/noExplicitAny: dynamic Convex query return type
    courses: Array<Record<string, any>>;
    formatDuration: (s: number) => string;
}) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredCourses = useMemo(() => {
        if (!searchQuery) return courses;
        const lower = searchQuery.toLowerCase();
        return courses.filter(
            (c) =>
                c.title.toLowerCase().includes(lower) || (c.description && c.description.toLowerCase().includes(lower)),
        );
    }, [courses, searchQuery]);

    return (
        <div className="space-y-4">
            <h2 className="text-3xl font-black tracking-tight text-black">コース</h2>

            {courses.length > 0 && (
                <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="コースを検索..."
                        className="w-full pl-10 pr-10 py-2 border-2 border-black rounded-lg bg-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-pop-yellow focus:border-black placeholder:font-normal placeholder:text-gray-400"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            )}

            {searchQuery && (
                <span className="text-sm font-bold text-gray-500">
                    {filteredCourses.length}/{courses.length}件
                </span>
            )}

            {filteredCourses.length === 0 ? (
                <div className="text-center py-16">
                    <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 font-bold">
                        {searchQuery ? "該当するコースが見つかりません。" : "コースはまだありません。"}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCourses.map((course) => (
                        <Link href={`/courses/${course._id}`} key={course._id} className="group block h-full">
                            <Card className="h-full overflow-hidden hover:shadow-none transition-all duration-300 hover:translate-x-1 hover:translate-y-1 border-4 border-black bg-white brutal-shadow rounded-xl">
                                <div className="aspect-video bg-gradient-to-br from-pop-purple to-pop-red relative overflow-hidden border-b-4 border-black flex items-center justify-center">
                                    <BookOpen className="w-16 h-16 text-white/80 group-hover:scale-110 transition-transform duration-500" />
                                    <div className="absolute top-2 right-2 z-10 flex gap-1">
                                        {course.isLocked && (
                                            <Badge
                                                variant="secondary"
                                                className="bg-gray-900 text-white border-2 border-white/20 backdrop-blur-sm shadow-sm gap-1 font-bold"
                                            >
                                                <Lock className="w-3 h-3" />
                                                限定公開
                                            </Badge>
                                        )}
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
                                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">{course.description}</p>
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
    );
}
