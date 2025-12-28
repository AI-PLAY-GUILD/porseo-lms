"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SignInButton } from "@clerk/nextjs";

interface BrutalistHeaderProps {
    isSignedIn: boolean;
    isMember: boolean;
    isAdmin?: boolean;
}

export function BrutalistHeader({ isSignedIn, isMember, isAdmin }: BrutalistHeaderProps) {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navItems = [
        { name: "特徴", href: "#features" },
        { name: "料金プラン", href: "#pricing" },
        { name: "FAQ", href: "#faq" },
    ];

    return (
        <header
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b-4 border-black",
                isScrolled ? "bg-cream py-3" : "bg-cream py-5"
            )}
        >
            <div className="container mx-auto px-4 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-10 h-10 bg-pop-red border-2 border-black flex items-center justify-center text-white font-black text-xl brutal-shadow-sm group-hover:translate-x-1 group-hover:translate-y-1 group-hover:shadow-none transition-all">
                        AI
                    </div>
                    <span className="text-2xl font-black text-black tracking-tighter">
                        AI PLAY GUILD
                    </span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="text-lg font-bold text-black hover:text-pop-purple transition-colors uppercase"
                        >
                            {item.name}
                        </Link>
                    ))}
                </nav>

                <div className="hidden md:flex items-center gap-4">
                    {isSignedIn ? (
                        <div className="flex gap-3">
                            {isAdmin && (
                                <Button asChild className="bg-pop-purple text-white border-2 border-black brutal-shadow-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none font-bold rounded-lg">
                                    <Link href="/admin">管理画面</Link>
                                </Button>
                            )}
                            <Button asChild className="bg-pop-green text-black border-2 border-black brutal-shadow-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none font-bold rounded-lg">
                                <Link href="/dashboard">ダッシュボード</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="flex gap-3">
                            <SignInButton mode="modal" forceRedirectUrl="/join">
                                <Button variant="ghost" className="text-black font-bold hover:bg-black/5 hover:text-pop-purple cursor-pointer">
                                    ログイン
                                </Button>
                            </SignInButton>
                            <Button asChild className="bg-black text-white border-2 border-black hover:bg-gray-800 brutal-shadow-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none font-bold rounded-lg">
                                <Link href="/join">今すぐ参加</Link>
                            </Button>
                        </div>
                    )}
                </div>

                {/* Mobile Nav */}
                <div className="md:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-black border-2 border-black brutal-shadow-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none bg-pop-yellow">
                                <Menu className="w-6 h-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="bg-cream border-l-4 border-black text-black">
                            <div className="flex flex-col gap-8 mt-10">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className="text-2xl font-black text-black hover:text-pop-purple uppercase"
                                    >
                                        {item.name}
                                    </Link>
                                ))}
                                <div className="h-1 bg-black my-2" />
                                {isSignedIn ? (
                                    <div className="flex flex-col gap-4">
                                        {isAdmin && (
                                            <Button asChild className="w-full bg-pop-purple text-white border-2 border-black brutal-shadow font-bold h-12">
                                                <Link href="/admin">管理画面</Link>
                                            </Button>
                                        )}
                                        <Button asChild className="w-full bg-pop-green text-black border-2 border-black brutal-shadow font-bold h-12">
                                            <Link href="/dashboard">ダッシュボード</Link>
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        <SignInButton mode="modal" forceRedirectUrl="/join">
                                            <Button variant="outline" className="w-full border-2 border-black font-bold h-12 bg-white text-black brutal-shadow cursor-pointer">
                                                ログイン
                                            </Button>
                                        </SignInButton>
                                        <Button asChild className="w-full bg-black text-white border-2 border-black font-bold h-12 brutal-shadow">
                                            <Link href="/join">今すぐ参加</Link>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
