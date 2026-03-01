"use client";

import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AdminSidebar } from "@/components/admin-sidebar";
import { BrutalistLoader } from "@/components/ui/brutalist-loader";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { api } from "../../../convex/_generated/api";

export default function AdminLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const userData = useQuery(api.users.getUser);
    const router = useRouter();

    useEffect(() => {
        if (userData !== undefined && !userData?.isAdmin) {
            router.push("/");
        }
    }, [userData, router]);

    if (userData === undefined) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-cream">
                <BrutalistLoader />
            </div>
        );
    }

    if (!userData?.isAdmin) {
        return null;
    }

    return (
        <SidebarProvider>
            <AdminSidebar
                user={userData ? { name: userData.name, email: userData.email, avatar: userData.imageUrl } : undefined}
            />
            <SidebarInset className="bg-cream">
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 w-full bg-cream px-4 border-b-2 border-black">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="hover:bg-pop-yellow border-2 border-black rounded-md transition-colors" />
                        <Separator orientation="vertical" className="mr-2 h-4 bg-black" />
                        <span className="font-black text-black">管理者コンソール</span>
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-3 sm:gap-6 sm:p-6">{children}</div>
            </SidebarInset>
        </SidebarProvider>
    );
}
