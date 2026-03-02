"use client";

import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function CoursesAdminPage() {
    const userData = useQuery(api.users.getUser);
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
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">コース管理</h2>
                <Link href="/admin/courses/new">
                    <Button className="font-bold">新規作成</Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>コース一覧</CardTitle>
                    <CardDescription>動画をテーマ別にパッケージ化して管理できます。</CardDescription>
                </CardHeader>
                <CardContent>
                    <CourseList />
                </CardContent>
            </Card>
        </div>
    );
}

function CourseList() {
    const courses = useQuery(api.courses.getCourses);
    const updateCourse = useMutation(api.courses.updateCourse);
    const deleteCourse = useMutation(api.courses.deleteCourse);

    if (courses === undefined) {
        return <div>読み込み中...</div>;
    }

    if (courses.length === 0) {
        return <div className="text-gray-500">コースがまだありません。</div>;
    }

    const handleDelete = async (courseId: Id<"courses">) => {
        if (!confirm("本当に削除しますか？")) return;
        try {
            await deleteCourse({ courseId });
        } catch (error) {
            const msg = error instanceof Error ? error.message : "不明なエラー";
            alert(`エラー: ${msg}`);
        }
    };

    const handleTogglePublish = async (courseId: Id<"courses">, current: boolean) => {
        try {
            await updateCourse({ courseId, isPublished: !current });
        } catch (error) {
            const msg = error instanceof Error ? error.message : "不明なエラー";
            alert(`エラー: ${msg}`);
        }
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b dark:border-gray-700">
                        <th className="py-3 px-4">タイトル</th>
                        <th className="py-3 px-4">動画数</th>
                        <th className="py-3 px-4">状態</th>
                        <th className="py-3 px-4">作成日</th>
                        <th className="py-3 px-4">操作</th>
                    </tr>
                </thead>
                <tbody>
                    {courses.map((course) => (
                        <tr
                            key={course._id}
                            className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                            <td className="py-3 px-4 font-medium">{course.title}</td>
                            <td className="py-3 px-4">
                                <Badge variant="secondary">{course.videos.length}本</Badge>
                            </td>
                            <td className="py-3 px-4">
                                <button
                                    onClick={() => handleTogglePublish(course._id, course.isPublished)}
                                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        course.isPublished
                                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                    }`}
                                >
                                    {course.isPublished ? "公開中" : "非公開"}
                                </button>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-500">
                                {new Date(course.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 flex gap-2">
                                <Link
                                    href={`/admin/courses/${course._id}/edit`}
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium px-2 py-1"
                                >
                                    編集
                                </Link>
                                <button
                                    onClick={() => handleDelete(course._id)}
                                    className="text-red-600 hover:text-red-800 text-sm font-medium px-2 py-1"
                                >
                                    削除
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
