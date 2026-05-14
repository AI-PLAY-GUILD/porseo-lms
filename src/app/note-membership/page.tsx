"use client";

import { SignOutButton, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { CheckCircle, ExternalLink, Link2, LogOut, ShieldAlert } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
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

const statusLabel: Record<string, string> = {
    active: "有効",
    confirmed: "確認済み",
    review: "確認待ち",
    rejected: "停止中",
};

export default function NoteMembershipPage() {
    const { user, isLoaded } = useUser();
    const claim = useQuery(api.noteMembership.getMyClaim);
    const [noteId, setNoteId] = useState("");
    const [memberNumber, setMemberNumber] = useState("");
    const [planName, setPlanName] = useState("");
    const [externalAccount, setExternalAccount] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const discordAccount = (user?.externalAccounts ?? []).find(
        (acc) => (acc.provider as string) === "oauth_discord" || (acc.provider as string) === "discord",
    );
    const hasDiscord = !!discordAccount;
    const sidebarUser = user
        ? {
              name: user.fullName ?? user.username ?? user.primaryEmailAddress?.emailAddress ?? "User",
              email: user.primaryEmailAddress?.emailAddress,
              avatar: user.imageUrl,
          }
        : undefined;

    const handleConnectDiscord = async () => {
        if (!user) return;
        await user.createExternalAccount({
            strategy: "oauth_discord",
            redirectUrl: "/sso-callback",
        });
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        setMessage(null);
        setError(null);

        try {
            const res = await fetch("/api/note-membership/claim", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    noteId,
                    memberNumber,
                    planName,
                    externalAccount,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "note連携に失敗しました");

            if (data.claim?.requiresReview) {
                setMessage("申請を受け付けました。note IDの重複があるため管理者確認後に反映されます。");
            } else {
                setMessage("noteメンバー権限を有効化しました。動画とDiscord特典を利用できます。");
            }
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : "note連携に失敗しました");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isLoaded || claim === undefined) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-cream">
                <BrutalistLoader />
            </div>
        );
    }

    return (
        <SidebarProvider>
            <AppSidebar user={sidebarUser} />
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

                <main className="max-w-3xl p-4 sm:p-8 space-y-6">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-black text-black">noteメンバー連携</h1>
                        <p className="mt-2 text-sm font-bold text-gray-600">
                            申請するとすぐにLMS権限を有効化します。運営が後からnote CSVで確認します。
                        </p>
                    </div>

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
                            <CardContent className="grid gap-2 text-sm font-bold">
                                <div>状態: {statusLabel[claim.status] ?? claim.status}</div>
                                <div>note ID: {claim.noteId}</div>
                                {claim.planName && <div>プラン: {claim.planName}</div>}
                                {claim.lastVerifiedAt && (
                                    <div>CSV確認: {new Date(claim.lastVerifiedAt).toLocaleDateString("ja-JP")}</div>
                                )}
                                {claim.reviewNote && <div className="text-amber-700">メモ: {claim.reviewNote}</div>}
                            </CardContent>
                        </Card>
                    )}

                    {!hasDiscord && (
                        <Card className="bg-amber-50 border-2 border-amber-400 rounded-xl">
                            <CardHeader>
                                <CardTitle className="font-black">Discord連携が必要です</CardTitle>
                                <CardDescription className="font-bold">
                                    noteメンバー権限のDiscordロール付与に使います。
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button onClick={handleConnectDiscord} className="bg-[#5865F2] text-white font-bold">
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Discordと連携する
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    <Card className="bg-white border-2 border-black brutal-shadow rounded-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 font-black">
                                <Link2 className="w-5 h-5" />
                                申請フォーム
                            </CardTitle>
                            <CardDescription className="font-bold">
                                note IDだけで有効化できます。会員番号とプラン名があるとCSV確認が楽になります。
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
                                        placeholder="例: ai_play_guild"
                                        className="border-2 border-black"
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="memberNumber" className="font-bold">
                                        会員番号
                                    </Label>
                                    <Input
                                        id="memberNumber"
                                        value={memberNumber}
                                        onChange={(event) => setMemberNumber(event.target.value)}
                                        placeholder="任意"
                                        className="border-2 border-black"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="planName" className="font-bold">
                                        加入プラン
                                    </Label>
                                    <Input
                                        id="planName"
                                        value={planName}
                                        onChange={(event) => setPlanName(event.target.value)}
                                        placeholder="任意"
                                        className="border-2 border-black"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="externalAccount" className="font-bold">
                                        noteに登録している外部サービスアカウント
                                    </Label>
                                    <Input
                                        id="externalAccount"
                                        value={externalAccount}
                                        onChange={(event) => setExternalAccount(event.target.value)}
                                        placeholder="任意"
                                        className="border-2 border-black"
                                    />
                                </div>

                                {message && <p className="text-sm font-bold text-green-700">{message}</p>}
                                {error && <p className="text-sm font-bold text-red-700">{error}</p>}

                                <Button
                                    type="submit"
                                    disabled={!hasDiscord || isSubmitting}
                                    className="bg-pop-green text-black border-2 border-black font-black brutal-shadow-sm"
                                >
                                    {isSubmitting ? "申請中..." : "noteメンバー権限を有効化する"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
