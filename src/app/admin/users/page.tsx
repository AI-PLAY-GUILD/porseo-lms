"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function UserListPage() {
    const userData = useQuery(api.users.getUser);
    const users = useQuery(api.users.getAllUsers);
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

    const activeSubscriberCount = users
        ? users.filter((u) => !u.isAdmin && u.subscriptionStatus === "active").length
        : 0;

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">ユーザー管理</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>ユーザー一覧</CardTitle>
                    <CardDescription>
                        登録されているユーザーの管理ができます。現在の有効会員数: {activeSubscriberCount}人
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <UserList users={users} />
                </CardContent>
            </Card>
        </div>
    );
}

function UserList({ users }: { users: Array<{ _id: string; name?: string; email?: string; imageUrl?: string; isAdmin?: boolean; subscriptionStatus?: string; createdAt: number }> | undefined }) {
    if (users === undefined) {
        return <div>読み込み中...</div>;
    }

    if (users.length === 0) {
        return <div className="text-gray-500">ユーザーがまだいません。</div>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b dark:border-gray-700">
                        <th className="py-3 px-4">ユーザー</th>
                        <th className="py-3 px-4">メールアドレス</th>
                        <th className="py-3 px-4">権限</th>
                        <th className="py-3 px-4">サブスクリプション</th>
                        <th className="py-3 px-4">登録日</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user._id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={user.imageUrl} />
                                        <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">{user.name}</span>
                                </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-500">
                                {user.email}
                            </td>
                            <td className="py-3 px-4">
                                {user.isAdmin ? (
                                    <Badge variant="default" className="bg-purple-600 hover:bg-purple-700">管理者</Badge>
                                ) : (
                                    <Badge variant="secondary">一般</Badge>
                                )}
                            </td>
                            <td className="py-3 px-4">
                                <Badge
                                    variant={user.subscriptionStatus === "active" ? "default" : "outline"}
                                    className={user.subscriptionStatus === "active" ? "bg-green-600 hover:bg-green-700" : ""}
                                >
                                    {user.subscriptionStatus === "active" ? "有効" : user.subscriptionStatus || "未加入"}
                                </Badge>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-500">
                                {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
