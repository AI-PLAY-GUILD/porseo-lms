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

  return (
    <Sidebar {...props} className="bg-white/5 backdrop-blur-xl border-r border-white/10">
      <SidebarHeader className="bg-transparent p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="grid flex-1 text-left leading-tight">
            <span className="truncate font-thin text-xl tracking-tight text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>AI PLAY GUILD</span>
            <span className="truncate text-xs font-light text-muted-foreground">Playground Area</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-transparent p-3 gap-4">
        {data.navMain.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel className="text-muted-foreground font-light text-xs uppercase tracking-wider mb-2 px-2">{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title} className="text-muted-foreground hover:bg-white/10 hover:text-foreground transition-all duration-200 data-[active=true]:bg-primary/10 data-[active=true]:text-primary rounded-lg px-3 py-2 h-auto group">
                      <a
                        href={item.url}
                        target={(item as any).external ? "_blank" : undefined}
                        rel={(item as any).external ? "noopener noreferrer" : undefined}
                        className="flex items-center gap-3 font-light"
                      >
                        <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
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
      <SidebarFooter className="bg-transparent p-4 border-t border-white/10">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="text-foreground hover:bg-white/10 transition-all rounded-xl p-2">
              <SignOutButton>
                <button className="flex w-full items-center gap-3 text-left">
                  <Avatar className="h-9 w-9 rounded-lg border border-white/10 shadow-sm">
                    <AvatarImage src={userData.avatar} alt={userData.name} />
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-light">CN</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-light text-foreground">{userData.name}</span>
                    <span className="truncate text-xs font-thin text-muted-foreground">{userData.email}</span>
                  </div>
                  <LogOut className="ml-auto size-4 text-muted-foreground hover:text-destructive transition-colors" />
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
