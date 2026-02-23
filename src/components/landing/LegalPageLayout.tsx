"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { BrutalistHeader } from "@/components/landing/BrutalistHeader";
import { BrutalistFooter } from "@/components/landing/BrutalistFooter";
import { BackToTop } from "@/components/landing/back-to-top";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface LegalPageLayoutProps {
    children: React.ReactNode;
    title: string;
    updatedAt: string;
}

export function LegalPageLayout({ children, title, updatedAt }: LegalPageLayoutProps) {
    const { isSignedIn } = useUser();
    const userData = useQuery(api.users.getUser);
    const isMember = userData?.subscriptionStatus === 'active';

    return (
        <div className="min-h-screen bg-white text-black font-body selection:bg-pop-yellow selection:text-black overflow-x-hidden">
            <BrutalistHeader isSignedIn={isSignedIn ?? false} isMember={isMember ?? false} isAdmin={userData?.isAdmin ?? false} />

            <main className="container mx-auto px-4 py-20 max-w-4xl min-h-[calc(100vh-200px)] pt-32">
                <Link href="/" className="inline-flex items-center text-sm font-bold opacity-50 hover:opacity-100 transition-opacity mb-8 border-b-2 border-transparent hover:border-black pb-1">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    トップページに戻る
                </Link>

                <div className="border-4 border-black p-8 md:p-12 bg-white brut-shadow">
                    <h1 className="text-3xl md:text-5xl font-black mb-4 uppercase tracking-tighter">{title}</h1>
                    <p className="text-sm font-bold opacity-50 mb-12 border-b-4 border-black pb-4">
                        最終更新日：{updatedAt}
                    </p>

                    <div className="prose prose-slate max-w-none 
                        prose-h2:text-2xl prose-h2:font-black prose-h2:mt-12 prose-h2:mb-4 prose-h2:border-l-8 prose-h2:border-pop-yellow prose-h2:pl-4
                        prose-p:text-base prose-p:font-medium prose-p:leading-relaxed prose-p:mb-6
                        prose-ul:list-disc prose-ul:font-medium text-slate-800
                        prose-ol:list-decimal prose-ol:font-medium
                        prose-li:mb-2
                        prose-strong:font-black prose-strong:bg-pop-yellow/30 prose-strong:px-1
                    ">
                        {children}
                    </div>
                </div>
            </main>

            <BrutalistFooter />
            <BackToTop />
        </div>
    );
}
