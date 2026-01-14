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
    <Sidebar {...props} className="bg-background border-r border-border/50">
      <SidebarHeader className="bg-background p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/20 overflow-hidden">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" />
          </div>
          <div className="grid flex-1 text-left leading-tight">
            <span className="truncate font-extrabold text-lg tracking-tight text-foreground">AI PLAY GUILD</span>
            <span className="truncate text-xs font-medium text-muted-foreground">Playground Area</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-background p-3 gap-4">
        {data.navMain.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel className="text-muted-foreground font-bold text-xs uppercase tracking-wider mb-2 px-2">{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title} className="text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-all duration-200 data-[active=true]:bg-primary/10 data-[active=true]:text-primary rounded-lg px-3 py-2 h-auto group">
                      <a
                        href={item.url}
                        target={(item as any).external ? "_blank" : undefined}
                        rel={(item as any).external ? "noopener noreferrer" : undefined}
                        className="flex items-center gap-3 font-medium"
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
      <SidebarFooter className="bg-background p-4 border-t border-border/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="text-foreground hover:bg-secondary/50 transition-all rounded-xl p-2">
              <SignOutButton>
                <button className="flex w-full items-center gap-3 text-left">
                  <Avatar className="h-9 w-9 rounded-lg border border-border/50 shadow-sm">
                    <AvatarImage src={userData.avatar} alt={userData.name} />
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold">CN</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-bold text-foreground">{userData.name}</span>
                    <span className="truncate text-xs font-medium text-muted-foreground">{userData.email}</span>
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
