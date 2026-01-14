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
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
                isScrolled ? "bg-white/5 backdrop-blur-md border-b border-white/10 py-3" : "bg-transparent py-5"
            )}
        >
            <div className="container mx-auto px-4 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group">
                    <span className="text-xl font-thin text-foreground tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                        AI PLAY GUILD
                    </span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="text-sm font-light text-muted-foreground hover:text-primary transition-colors"
                        >
                            {item.name}
                        </Link>
                    ))}
                </nav>

                <div className="hidden md:flex items-center gap-4">
                    {isSignedIn ? (
                        <div className="flex gap-3">
                            {isAdmin && (
                                <Button asChild variant="outline" className="rounded-full font-light border-white/20 bg-white/5 hover:bg-white/10">
                                    <Link href="/admin">管理画面</Link>
                                </Button>
                            )}
                            <Button asChild className="rounded-full font-normal bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                                <Link href="/dashboard">ダッシュボード</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="flex gap-3">
                            <SignInButton mode="modal" forceRedirectUrl="/join">
                                <Button variant="ghost" className="text-muted-foreground font-light hover:text-primary cursor-pointer hover:bg-white/5">
                                    ログイン
                                </Button>
                            </SignInButton>
                            <Button asChild className="rounded-full font-normal bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                                <Link href="/join">今すぐ参加</Link>
                            </Button>
                        </div>
                    )}
                </div>

                {/* Mobile Nav */}
                <div className="md:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-foreground hover:bg-white/5">
                                <Menu className="w-6 h-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="bg-[#f6f6f8] dark:bg-[#101622] border-l border-white/10 text-foreground">
                            <div className="flex flex-col gap-8 mt-10">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className="text-xl font-light text-foreground hover:text-primary"
                                    >
                                        {item.name}
                                    </Link>
                                ))}
                                <div className="h-px bg-white/10 my-2" />
                                {isSignedIn ? (
                                    <div className="flex flex-col gap-4">
                                        {isAdmin && (
                                            <Button asChild variant="outline" className="w-full rounded-full h-12 font-light border-white/20 bg-white/5 hover:bg-white/10">
                                                <Link href="/admin">管理画面</Link>
                                            </Button>
                                        )}
                                        <Button asChild className="w-full rounded-full h-12 font-normal bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                                            <Link href="/dashboard">ダッシュボード</Link>
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        <SignInButton mode="modal" forceRedirectUrl="/join">
                                            <Button variant="outline" className="w-full rounded-full h-12 font-light border-white/20 bg-white/5 hover:bg-white/10 cursor-pointer">
                                                ログイン
                                            </Button>
                                        </SignInButton>
                                        <Button asChild className="w-full rounded-full h-12 font-normal bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
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
