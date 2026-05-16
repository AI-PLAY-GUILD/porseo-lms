"use client";

import { SignOutButton, useSignIn, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { CheckCircle, ExternalLink, Link2, LogIn, LogOut, MessageCircle, ShieldAlert } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { api } from "../../../convex/_generated/api";

const PENDING_NOTE_ID_KEY = "aiplayguild:pendingNoteMembershipNoteId";
const DISCORD_URL = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "https://discord.com/app";

const statusLabel: Record<string, string> = {
    active: "有効",
    confirmed: "確認済み",
    review: "確認待ち",
    rejected: "停止中",
};

export default function NoteMembershipPage() {
    const { user, isLoaded } = useUser();
    const { signIn, isLoaded: isSignInLoaded } = useSignIn();
    const stats = useQuery(api.dashboard.getStats, user ? {} : "skip");
    const claim = useQuery(api.noteMembership.getMyClaim, user ? {} : "skip");
    const [noteId, setNoteId] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const autoClaimStarted = useRef(false);

    const discordAccount = user?.externalAccounts.find(
        (acc) => (acc.provider as string) === "oauth_discord" || (acc.provider as string) === "discord",
    );
    const hasDiscord = !!discordAccount;

    const activateClaim = async (targetNoteId: string) => {
        const normalizedNoteId = targetNoteId.trim().replace(/^@/, "");
        if (!normalizedNoteId) {
            setError("note IDを入力してください");
            return;
        }

        setIsSubmitting(true);
        setMessage(null);
        setError(null);

        try {
            const res = await fetch("/api/note-membership/claim", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    noteId: normalizedNoteId,
                    planName: "Proプラン",
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "noteメンバー権限の有効化に失敗しました");

            window.sessionStorage.removeItem(PENDING_NOTE_ID_KEY);
            if (data.claim?.requiresReview) {
                setMessage("申請を受け付けました。note IDの重複があるため、管理者確認後に反映されます。");
            } else if (data.discordRoleWarning) {
                setMessage(
                    "noteメンバー権限を有効化しました。Discord参加だけ手動確認が必要な場合があります。下のDiscordボタンから開いてください。",
                );
            } else {
                setMessage("noteメンバー権限を有効化しました。LMSとDiscordコミュニティを利用できます。");
            }
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : "noteメンバー権限の有効化に失敗しました");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConnectDiscord = async () => {
        if (!user) return;
        await user.createExternalAccount({
            strategy: "oauth_discord",
            redirectUrl: "/sso-callback",
        });
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const normalizedNoteId = noteId.trim().replace(/^@/, "");
        if (!normalizedNoteId) {
            setError("note IDを入力してください");
            return;
        }

        if (!user) {
            window.sessionStorage.setItem(PENDING_NOTE_ID_KEY, normalizedNoteId);
            if (!isSignInLoaded || !signIn) {
                window.location.href = "/login?redirect_url=/note-membership";
                return;
            }

            await signIn.authenticateWithRedirect({
                strategy: "oauth_discord",
                redirectUrl: "/sso-callback",
                redirectUrlComplete: "/note-membership",
            });
            return;
        }

        if (!hasDiscord) {
            window.sessionStorage.setItem(PENDING_NOTE_ID_KEY, normalizedNoteId);
            await handleConnectDiscord();
            return;
        }

        await activateClaim(normalizedNoteId);
    };

    useEffect(() => {
        if (!isLoaded || !user || claim === undefined || !hasDiscord || autoClaimStarted.current) return;

        const pendingNoteId = window.sessionStorage.getItem(PENDING_NOTE_ID_KEY);
        if (!pendingNoteId || claim) return;

        autoClaimStarted.current = true;
        setNoteId(pendingNoteId);
        void activateClaim(pendingNoteId);
    }, [isLoaded, user, claim, hasDiscord]);

    if (!isLoaded || (user && (stats === undefined || claim === undefined))) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-cream">
                <BrutalistLoader />
            </div>
        );
    }

    const content = (
        <main className="max-w-3xl p-4 sm:p-8 space-y-6">
            <div>
                <h1 className="text-3xl sm:text-4xl font-black text-black">noteメンバー連携</h1>
                <p className="mt-2 text-sm font-bold text-gray-600">
                    note IDを入力してDiscordでログインすると、LMSのプロプラン権限とDiscordコミュニティ参加を有効化します。
                </p>
            </div>

            <Card className="bg-white border-2 border-black brutal-shadow rounded-xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-black">
                        <Link2 className="w-5 h-5" />
                        メンバーシップ参加者はこちら
                    </CardTitle>
                    <CardDescription className="font-bold">
                        1. note IDを入力する → 2. Discordでログインする → 3. LMSとDiscordの権限が有効になります。
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="noteId" className="font-bold">
                                note ID
                            </Label>
                            <Input
                                id="noteId"
                                value={noteId}
                                onChange={(event) => setNoteId(event.target.value)}
                                placeholder="例: meru2002"
                                className="border-2 border-black"
                                required
                            />
                            <p className="text-xs font-bold text-gray-500">
                                noteプロフィールURLの末尾、またはnote上のユーザー名を入力してください。
                            </p>
                        </div>

                        {message && <p className="text-sm font-bold text-green-700">{message}</p>}
                        {error && <p className="text-sm font-bold text-red-700">{error}</p>}

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-pop-green text-black border-2 border-black font-black brutal-shadow-sm"
                        >
                            {isSubmitting ? (
                                "有効化中..."
                            ) : (
                                <>
                                    <LogIn className="w-4 h-4 mr-2" />
                                    Discordでログインして有効化する
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {!user && (
                <Card className="bg-sky-50 border-2 border-sky-300 rounded-xl">
                    <CardHeader>
                        <CardTitle className="font-black">Discordアカウントについて</CardTitle>
                        <CardDescription className="font-bold">
                            Discordアカウントがまだない場合は、先にDiscordでアカウント作成と認証を済ませてください。
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="bg-[#5865F2] text-white font-bold">
                            <a href="https://discord.com/register" target="_blank" rel="noreferrer">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Discordを開く
                            </a>
                        </Button>
                    </CardContent>
                </Card>
            )}

            {user && !hasDiscord && (
                <Card className="bg-amber-50 border-2 border-amber-400 rounded-xl">
                    <CardHeader>
                        <CardTitle className="font-black">Discordログインが必要です</CardTitle>
                        <CardDescription className="font-bold">
                            入力したnote IDを保存したまま、Discordログインへ進みます。
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={handleConnectDiscord} className="bg-[#5865F2] text-white font-bold">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Discordでログインする
                        </Button>
                    </CardContent>
                </Card>
            )}

            {claim && (
                <Card className="bg-white border-2 border-black brutal-shadow rounded-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 font-black">
                            {claim.status === "rejected" ? (
                                <ShieldAlert className="w-5 h-5 text-red-600" />
                            ) : (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            )}
                            現在の連携状態
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 text-sm font-bold">
                        <div>状態: {statusLabel[claim.status] ?? claim.status}</div>
                        <div>note ID: {claim.noteId}</div>
                        {claim.planName && <div>プラン: {claim.planName}</div>}
                        {claim.lastVerifiedAt && (
                            <div>CSV確認: {new Date(claim.lastVerifiedAt).toLocaleDateString("ja-JP")}</div>
                        )}
                        {claim.reviewNote && <div className="text-amber-700">メモ: {claim.reviewNote}</div>}
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <Button asChild className="bg-black text-white font-black">
                                <a href="/dashboard">LMSを開く</a>
                            </Button>
                            <Button asChild className="bg-[#5865F2] text-white font-black">
                                <a href={DISCORD_URL} target="_blank" rel="noreferrer">
                                    <MessageCircle className="w-4 h-4 mr-2" />
                                    Discordに入る
                                </a>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </main>
    );

    if (!user) {
        return <div className="min-h-screen bg-cream">{content}</div>;
    }

    return (
        <SidebarProvider>
            <AppSidebar
                user={
                    stats
                        ? {
                              name: stats.userName,
                              email: user?.emailAddresses?.[0]?.emailAddress,
                              avatar: stats.userAvatar,
                          }
                        : undefined
                }
            />
            <SidebarInset className="bg-cream">
                <header className="flex h-16 shrink-0 items-center gap-2 w-full bg-cream px-4">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="hover:bg-pop-yellow border-2 border-black rounded-md transition-colors" />
                        <Separator orientation="vertical" className="mr-2 h-4 bg-black" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/dashboard" className="font-bold text-gray-600">
                                        設定
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="text-black" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="font-black text-black">noteメンバー連携</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    <div className="ml-auto">
                        <SignOutButton>
                            <Button
                                variant="outline"
                                size="sm"
                                className="font-bold border-2 border-black bg-white hover:bg-gray-100 brutal-shadow-sm"
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                ログアウト
                            </Button>
                        </SignOutButton>
                    </div>
                </header>

                {content}
            </SidebarInset>
        </SidebarProvider>
    );
}
