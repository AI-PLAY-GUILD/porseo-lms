"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import {
  BookOpen,
  LayoutDashboard,
  Settings,
  User,
  Video,
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

  return (
    <Sidebar {...props} className="bg-cream text-black">
      <SidebarHeader className="bg-cream p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border-2 border-black text-white brutal-shadow-sm overflow-hidden">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div className="grid flex-1 text-left leading-tight">
            <span className="truncate font-black text-lg tracking-tight text-black">AI PLAY GUILD</span>
            <span className="truncate text-xs font-bold text-gray-600">Playground Area</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-cream p-2 gap-4">
        {data.navMain.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel className="text-black font-black text-sm uppercase tracking-wider mb-2 px-2">{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-2">
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title} className="text-black hover:bg-pop-purple/20 hover:text-black hover:translate-x-1 transition-all duration-200 data-[active=true]:bg-pop-yellow data-[active=true]:text-black data-[active=true]:border-2 data-[active=true]:border-black data-[active=true]:brutal-shadow-sm rounded-lg px-3 py-2 h-auto">
                      <a
                        href={item.url}
                        target={(item as any).external ? "_blank" : undefined}
                        rel={(item as any).external ? "noopener noreferrer" : undefined}
                        className="flex items-center gap-3 font-bold"
                      >
                        <item.icon className="w-5 h-5" />
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
      <SidebarFooter className="bg-cream p-4 gap-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="text-black cursor-default hover:bg-transparent border-2 border-transparent rounded-lg">
              <Avatar className="h-8 w-8 rounded-lg border-2 border-black">
                <AvatarImage src={userData.avatar} alt={userData.name} />
                <AvatarFallback className="rounded-lg bg-pop-green font-bold text-black">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold text-black">{userData.name}</span>
                <span className="truncate text-xs font-medium text-gray-600">{userData.email}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
