"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AiChatInterface } from "@/components/ai/ai-chat-interface";
import { AppSidebar } from "@/components/app-sidebar";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { BrutalistLoader } from "@/components/ui/brutalist-loader";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { api } from "../../../convex/_generated/api";

export default function AiAgentPage() {
    const router = useRouter();
    const { user } = useUser();
    const stats = useQuery(api.dashboard.getStats);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // サブスクリプションゲート
    useEffect(() => {
        if (isMounted && stats) {
            const status = stats.subscriptionStatus;
            if (status !== "active" && status !== "past_due") {
                router.push("/join");
            }
        }
    }, [isMounted, stats, router]);

    if (!isMounted || stats === undefined) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-cream">
                <BrutalistLoader />
            </div>
        );
    }

    if (stats === null) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-cream flex-col">
                <BrutalistLoader />
                <p className="mt-4 font-bold text-gray-500 animate-pulse">ユーザー情報を同期中...</p>
            </div>
        );
    }

    return (
        <SidebarProvider>
            <AppSidebar
                user={{
                    name: stats.userName,
                    email: user?.emailAddresses?.[0]?.emailAddress,
                    avatar: stats.userAvatar,
                }}
            />
            <SidebarInset className="bg-cream">
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 w-full bg-cream px-4 border-b-3 border-black">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="hover:bg-pop-yellow border-2 border-black rounded-md transition-colors" />
                        <Separator orientation="vertical" className="mr-2 h-4 bg-black" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink
                                        href="/dashboard"
                                        className="font-bold text-gray-600 hover:text-black"
                                    >
                                        学習プラットフォーム
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="text-black" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="font-black text-black">学習アシスタント</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <AiChatInterface />
            </SidebarInset>
        </SidebarProvider>
    );
}
