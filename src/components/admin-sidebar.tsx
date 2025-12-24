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
        <Sidebar {...props} className="bg-cream text-black">
            <SidebarHeader className="bg-cream p-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="hover:bg-transparent">
                            <Link href="/admin">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-pop-purple border-2 border-black text-white brutal-shadow-sm">
                                    <Settings className="size-4" />
                                </div>
                                <div className="flex flex-col gap-0.5 leading-none">
                                    <span className="font-black text-lg tracking-tight text-black">Admin Panel</span>
                                    <span className="text-xs font-bold text-gray-600">v1.0.0</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent className="bg-cream p-2 gap-4">
                <SidebarMenu className="gap-2">
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname === "/admin"} className="text-black hover:bg-pop-purple/20 hover:text-black hover:translate-x-1 transition-all duration-200 data-[active=true]:bg-pop-yellow data-[active=true]:text-black data-[active=true]:border-2 data-[active=true]:border-black data-[active=true]:brutal-shadow-sm rounded-lg px-3 py-2 h-auto">
                            <Link href="/admin" className="flex items-center gap-3 font-bold">
                                <LayoutDashboard className="w-5 h-5" />
                                <span>分析</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                        <div className="px-2 py-2">
                            <span className="text-black font-black text-sm uppercase tracking-wider">ユーザー管理</span>
                        </div>
                        <SidebarMenu className="gap-1">
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={pathname === "/admin/users"} className="text-black hover:bg-pop-purple/20 hover:text-black hover:translate-x-1 transition-all duration-200 data-[active=true]:bg-pop-yellow data-[active=true]:text-black data-[active=true]:border-2 data-[active=true]:border-black data-[active=true]:brutal-shadow-sm rounded-lg px-3 py-2 h-auto">
                                    <Link href="/admin/users" className="flex items-center gap-3 font-bold">
                                        <div className="flex w-6 items-center justify-center">
                                            <div className="h-1.5 w-1.5 rounded-full bg-current" />
                                        </div>
                                        <span>ユーザー一覧</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={pathname === "/admin/users/analytics"} className="text-black hover:bg-pop-purple/20 hover:text-black hover:translate-x-1 transition-all duration-200 data-[active=true]:bg-pop-yellow data-[active=true]:text-black data-[active=true]:border-2 data-[active=true]:border-black data-[active=true]:brutal-shadow-sm rounded-lg px-3 py-2 h-auto">
                                    <Link href="/admin/users/analytics" className="flex items-center gap-3 font-bold">
                                        <div className="flex w-6 items-center justify-center">
                                            <div className="h-1.5 w-1.5 rounded-full bg-current" />
                                        </div>
                                        <span>行動分析</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                        <div className="px-2 py-2">
                            <span className="text-black font-black text-sm uppercase tracking-wider">動画管理</span>
                        </div>
                        <SidebarMenu className="gap-1">
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={pathname === "/admin/videos"} className="text-black hover:bg-pop-purple/20 hover:text-black hover:translate-x-1 transition-all duration-200 data-[active=true]:bg-pop-yellow data-[active=true]:text-black data-[active=true]:border-2 data-[active=true]:border-black data-[active=true]:brutal-shadow-sm rounded-lg px-3 py-2 h-auto">
                                    <Link href="/admin/videos" className="flex items-center gap-3 font-bold">
                                        <div className="flex w-6 items-center justify-center">
                                            <div className="h-1.5 w-1.5 rounded-full bg-current" />
                                        </div>
                                        <span>動画一覧</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={pathname === "/admin/videos/upload"} className="text-black hover:bg-pop-purple/20 hover:text-black hover:translate-x-1 transition-all duration-200 data-[active=true]:bg-pop-yellow data-[active=true]:text-black data-[active=true]:border-2 data-[active=true]:border-black data-[active=true]:brutal-shadow-sm rounded-lg px-3 py-2 h-auto">
                                    <Link href="/admin/videos/upload" className="flex items-center gap-3 font-bold">
                                        <div className="flex w-6 items-center justify-center">
                                            <div className="h-1.5 w-1.5 rounded-full bg-current" />
                                        </div>
                                        <span>動画アップロード</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={pathname === "/admin/tags"} className="text-black hover:bg-pop-purple/20 hover:text-black hover:translate-x-1 transition-all duration-200 data-[active=true]:bg-pop-yellow data-[active=true]:text-black data-[active=true]:border-2 data-[active=true]:border-black data-[active=true]:brutal-shadow-sm rounded-lg px-3 py-2 h-auto">
                                    <Link href="/admin/tags" className="flex items-center gap-3 font-bold">
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
            <SidebarFooter className="bg-cream p-4 gap-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild className="text-black hover:bg-gray-100 border-2 border-transparent hover:border-black hover:brutal-shadow-sm transition-all rounded-lg">
                            <Link href="/dashboard">
                                <User className="w-4 h-4" />
                                <span className="font-bold">ユーザー画面へ戻る</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SignOutButton>
                            <SidebarMenuButton className="text-black hover:bg-gray-100 border-2 border-transparent hover:border-black hover:brutal-shadow-sm transition-all rounded-lg">
                                <LogOut className="w-4 h-4" />
                                <span className="font-bold">ログアウト</span>
                            </SidebarMenuButton>
                        </SignOutButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar >
    );
}
