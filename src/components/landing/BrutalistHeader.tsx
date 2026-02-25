"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { WaveButton } from "@/components/ui/wave-button";
import { cn } from "@/lib/utils";

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
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
                isScrolled ? "bg-white/80 backdrop-blur-md py-4 shadow-sm" : "bg-transparent py-6",
            )}
        >
            <div className="container mx-auto px-4 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group">
                    <span className="text-2xl font-light text-slate-900 tracking-tight hover:opacity-70 transition-opacity font-[family-name:var(--font-jp)]">
                        AI PLAY GUILD
                    </span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors tracking-wide"
                        >
                            {item.name}
                        </Link>
                    ))}
                </nav>

                <div className="hidden md:flex items-center gap-4">
                    {isSignedIn ? (
                        <div className="flex gap-3">
                            {isAdmin && (
                                <Button
                                    asChild
                                    variant="ghost"
                                    className="rounded-full font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                >
                                    <Link href="/admin">管理画面</Link>
                                </Button>
                            )}
                            <Button
                                asChild
                                className="rounded-full bg-slate-900 text-white hover:bg-slate-800 shadow-sm font-medium px-6"
                            >
                                <Link href="/dashboard">ダッシュボード</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="flex gap-3">
                            <Button
                                asChild
                                variant="ghost"
                                className="rounded-full font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            >
                                <Link href="/login">ログイン</Link>
                            </Button>
                            <WaveButton
                                href="/join"
                                text="今すぐ参加"
                                hoverText="Start!"
                                className="w-36 h-12 text-sm rounded-md shadow-md"
                            />
                        </div>
                    )}
                </div>

                {/* Mobile Nav */}
                <div className="md:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-slate-900 hover:bg-slate-100 rounded-full"
                            >
                                <Menu className="w-6 h-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent
                            side="right"
                            className="bg-white/95 backdrop-blur-xl border-l border-slate-100 text-slate-900"
                        >
                            <div className="flex flex-col gap-8 mt-10">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className="text-xl font-medium text-slate-900 hover:text-blue-600"
                                    >
                                        {item.name}
                                    </Link>
                                ))}
                                <div className="h-px bg-slate-100 my-2" />
                                {isSignedIn ? (
                                    <div className="flex flex-col gap-4">
                                        {isAdmin && (
                                            <Button
                                                asChild
                                                variant="ghost"
                                                className="w-full justify-start rounded-xl font-medium text-slate-600"
                                            >
                                                <Link href="/admin">管理画面</Link>
                                            </Button>
                                        )}
                                        <Button
                                            asChild
                                            className="w-full rounded-full bg-slate-900 text-white h-12 font-medium"
                                        >
                                            <Link href="/dashboard">ダッシュボード</Link>
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        <Button
                                            asChild
                                            variant="ghost"
                                            className="w-full rounded-full font-medium text-slate-600 hover:bg-slate-50 h-12 border border-slate-200"
                                        >
                                            <Link href="/login">ログイン</Link>
                                        </Button>
                                        <Button
                                            asChild
                                            className="w-full rounded-full bg-blue-600 text-white hover:bg-blue-500 h-12 font-medium shadow-lg shadow-blue-100"
                                        >
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
