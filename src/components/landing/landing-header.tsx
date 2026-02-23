"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface LandingHeaderProps {
    isSignedIn: boolean;
    isMember: boolean;
}

export function LandingHeader({ isSignedIn, isMember }: LandingHeaderProps) {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navItems = [
        { name: "Features", href: "#features" },
        { name: "Pricing", href: "#pricing" },
        { name: "FAQ", href: "#faq" },
    ];

    return (
        <header
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent",
                isScrolled ? "bg-black/50 backdrop-blur-md border-white/10 py-3" : "bg-transparent py-5",
            )}
        >
            <div className="container mx-auto px-4 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg group-hover:shadow-[0_0_20px_rgba(79,70,229,0.5)] transition-all duration-300">
                        AI
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        AI Play Guild
                    </span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                        >
                            {item.name}
                        </Link>
                    ))}
                </nav>

                <div className="hidden md:flex items-center gap-4">
                    {isSignedIn ? (
                        <Button
                            asChild
                            variant="outline"
                            className="border-white/20 hover:bg-white/10 hover:text-white"
                        >
                            <Link href="/dashboard">Dashboard</Link>
                        </Button>
                    ) : (
                        <div className="flex gap-3">
                            <Button asChild variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/5">
                                <Link href="/sign-in">Login</Link>
                            </Button>
                            <Button asChild className="bg-white text-black hover:bg-gray-200">
                                <Link href="/join">Join Now</Link>
                            </Button>
                        </div>
                    )}
                </div>

                {/* Mobile Nav */}
                <div className="md:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-white">
                                <Menu className="w-6 h-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="bg-black/95 border-white/10 text-white">
                            <div className="flex flex-col gap-8 mt-10">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className="text-lg font-medium text-gray-300 hover:text-white"
                                    >
                                        {item.name}
                                    </Link>
                                ))}
                                <div className="h-px bg-white/10 my-2" />
                                {isSignedIn ? (
                                    <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                                        <Link href="/dashboard">Dashboard</Link>
                                    </Button>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        <Button asChild variant="outline" className="w-full border-white/20">
                                            <Link href="/sign-in">Login</Link>
                                        </Button>
                                        <Button asChild className="w-full bg-white text-black">
                                            <Link href="/join">Join Now</Link>
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
