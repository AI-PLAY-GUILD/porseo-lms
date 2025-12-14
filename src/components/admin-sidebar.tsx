"use client";

import * as React from "react";
import {
    LayoutDashboard,
    Settings,
    LogOut,
    User,
} from "lucide-react";

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar";
import { SignOutButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar> & { user?: { name: string; email: string; avatar?: string } }) {
    const pathname = usePathname();

    return (
        <Sidebar {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/admin">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                    <Settings className="size-4" />
                                </div>
                                <div className="flex flex-col gap-0.5 leading-none">
                                    <span className="font-semibold">Admin Panel</span>
                                    <span className="">v1.0.0</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname === "/admin"}>
                            <Link href="/admin">
                                <LayoutDashboard />
                                <span>分析</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                        <SidebarMenuButton className="text-sidebar-foreground/70">
                            <span>動画管理</span>
                        </SidebarMenuButton>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={pathname === "/admin/videos"}>
                                    <Link href="/admin/videos">
                                        <div className="flex w-6 items-center justify-center">
                                            <div className="h-1.5 w-1.5 rounded-full bg-current" />
                                        </div>
                                        <span>動画一覧</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={pathname === "/admin/videos/upload"}>
                                    <Link href="/admin/videos/upload">
                                        <div className="flex w-6 items-center justify-center">
                                            <div className="h-1.5 w-1.5 rounded-full bg-current" />
                                        </div>
                                        <span>動画アップロード</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={pathname === "/admin/tags"}>
                                    <Link href="/admin/tags">
                                        <div className="flex w-6 items-center justify-center">
                                            <div className="h-1.5 w-1.5 rounded-full bg-current" />
                                        </div>
                                        <span>タグ管理</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <Link href="/dashboard">
                                <User />
                                <span>ユーザー画面へ戻る</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SignOutButton>
                            <SidebarMenuButton>
                                <LogOut />
                                <span>ログアウト</span>
                            </SidebarMenuButton>
                        </SignOutButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
