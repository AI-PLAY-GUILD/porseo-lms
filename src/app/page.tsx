"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { BackgroundAnimation } from "@/components/background-animation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, LayoutDashboard, ShieldCheck } from "lucide-react";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function Home() {
  const { isSignedIn } = useAuth();
  const userData = useQuery(api.users.getUser);
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.fromTo(titleRef.current,
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, delay: 0.2 }
    )
      .fromTo(cardRef.current,
        { y: 40, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.8 },
        "-=0.4"
      );
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden font-[family-name:var(--font-geist-sans)] text-white">
      <BackgroundAnimation />

      <main className="z-10 flex flex-col items-center gap-8 p-8 sm:p-20 w-full max-w-4xl">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 ref={titleRef} className="flex flex-col items-center gap-2 opacity-0">
            <span className="text-xl sm:text-2xl font-medium text-blue-300 tracking-[0.2em] uppercase">
              AI Community Platform
            </span>
            <span className="text-6xl sm:text-8xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-gray-400 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
              PORSEO
            </span>
          </h1>
        </div>

        <div ref={cardRef} className="flex flex-col items-center gap-6 mt-10 w-full max-w-md opacity-0">
          {isSignedIn ? (
            <div className="flex flex-col items-center gap-6 w-full backdrop-blur-xl bg-black/30 border border-white/10 p-8 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] ring-1 ring-white/5">
              <div className="text-center space-y-2">
                <p className="text-sm font-medium text-blue-300 uppercase tracking-wider">Welcome Back</p>
                <p className="text-2xl font-bold text-white">{userData?.name} さん</p>
              </div>

              <div className="flex flex-col gap-4 w-full">
                <Button asChild size="lg" className="w-full h-14 text-lg font-bold bg-white text-black hover:bg-gray-200 hover:scale-[1.02] transition-all duration-300 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                  <Link href="/dashboard" className="flex items-center justify-center gap-2">
                    <LayoutDashboard className="w-5 h-5" />
                    学習を再開する
                    <ArrowRight className="w-5 h-5 ml-1" />
                  </Link>
                </Button>

                {userData?.isAdmin && (
                  <Button asChild variant="outline" size="lg" className="w-full h-12 text-base font-medium border-white/20 bg-transparent hover:bg-white/10 text-gray-300 hover:text-white transition-all duration-300 rounded-xl">
                    <Link href="/admin" className="flex items-center justify-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      管理者ダッシュボード
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-8 w-full backdrop-blur-xl bg-black/30 border border-white/10 p-10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] ring-1 ring-white/5">
              <div className="space-y-4 text-center">
                <div className="inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium tracking-wider uppercase">
                  Members Only
                </div>
                <p className="text-gray-300 leading-relaxed">
                  コミュニティメンバー限定の<br />
                  プレミアムコンテンツへアクセス
                </p>
              </div>

              <SignInButton mode="modal">
                <Button size="lg" className="w-full h-14 text-lg font-bold bg-[#5865F2] hover:bg-[#4752C4] hover:scale-[1.02] shadow-[0_0_30px_rgba(88,101,242,0.4)] transition-all duration-300 rounded-xl">
                  Discordでログイン
                </Button>
              </SignInButton>
            </div>
          )}
        </div>
      </main>

      <footer className="absolute bottom-6 text-[10px] text-gray-600 z-10 uppercase tracking-widest">
        © 2025 PORSEO AI Community Platform
      </footer>
    </div>
  );
}
