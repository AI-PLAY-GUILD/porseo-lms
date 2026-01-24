"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { SignOutButton } from "@clerk/nextjs"
import {
    BookOpen,
    LayoutDashboard,
    Settings,
    LogOut,
    User,
    Video,
    Moon,
    Sun,
    Users,
    MessageCircle,
} from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// This is sample data.
const data = {
    user: {
        name: "User",
        email: "user@example.com",
        avatar: "/avatars/shadcn.jpg",
    },
    navMain: [
        {
            title: "繋がる",
            url: "#",
            icon: Users,
            items: [
                {
                    title: "Discordサーバー",
                    url: process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "https://discord.com/app",
                    icon: MessageCircle,
                    external: true,
                },
            ],
        },
        {
            title: "学習",
            url: "#",
            icon: BookOpen,
            isActive: true,
            items: [
                {
                    title: "ダッシュボード",
                    url: "/dashboard",
                    icon: LayoutDashboard,
                },
            ],
        },
        {
            title: "ナレッジ",
            url: "#",
            icon: Video,
            items: [
                {
                    title: "ハンズオン動画",
                    url: "/videos",
                    icon: Video,
                },
            ],
        },
        {
            title: "設定",
            url: "#",
            icon: Settings,
            items: [
                {
                    title: "プロフィール",
                    url: "/profile",
                    icon: User,
                },
            ],
        },
    ],
}

export function AppSidebar({ user, ...props }: React.ComponentProps<typeof Sidebar> & { user?: { name?: string; email?: string; avatar?: string } }) {
    const userData = user || data.user;
    const { setTheme, theme } = useTheme()

    return (
        <Sidebar {...props}>
            <SidebarHeader>
                <div className="flex items-center gap-2 px-2 py-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <BookOpen className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">AIガチ部</span>
                        <span className="truncate text-xs">Knowledge Port</span>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
                {data.navMain.map((group) => (
                    <SidebarGroup key={group.title}>
                        <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {group.items.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild tooltip={item.title}>
                                            <a
                                                href={item.url}
                                                target={(item as any).external ? "_blank" : undefined}
                                                rel={(item as any).external ? "noopener noreferrer" : undefined}
                                            >
                                                <item.icon />
                                                <span>{item.title}</span>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            tooltip="テーマ切り替え"
                        >
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg">
                                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">テーマ切り替え</span>
                                <span className="truncate text-xs">{theme === "dark" ? "ダークモード" : "ライトモード"}</span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <SignOutButton>
                                <button className="flex w-full items-center gap-2 text-left">
                                    <Avatar className="h-8 w-8 rounded-lg">
                                        <AvatarImage src={userData.avatar} alt={userData.name} />
                                        <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">{userData.name}</span>
                                        <span className="truncate text-xs">{userData.email}</span>
                                    </div>
                                    <LogOut className="ml-auto size-4" />
                                </button>
                            </SignOutButton>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
