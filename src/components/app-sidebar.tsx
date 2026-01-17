"use client"

import * as React from "react"
import {
  BookOpen,
  LayoutDashboard,
  Settings,
  MessageCircle,
  Video,
  User,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "User",
    email: "user@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "ダッシュボード",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "ハンズオン動画",
      url: "/videos",
      icon: Video,
    },
    {
      title: "プロフィール",
      url: "/profile",
      icon: User,
    },
  ],
  navSecondary: [
    {
      title: "Discordサーバー",
      url: process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "https://discord.com/app",
      icon: MessageCircle,
    },
  ],
}

export function AppSidebar({ user, ...props }: React.ComponentProps<typeof Sidebar> & { user?: { name: string; email: string; avatar?: string } }) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <BookOpen className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">AI PLAY GUILD</span>
                  <span className="truncate text-xs">Learning Platform</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user ? { ...user, avatar: user.avatar || data.user.avatar } : data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
