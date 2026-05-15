"use client";

import { useAuth } from "@clerk/nextjs";
import { CheckCircle, Loader2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Status = "loading" | "success" | "warning" | "error";

function NoteEntryActivateContent() {
    const { isLoaded, isSignedIn } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const noteId = searchParams.get("noteId")?.trim().replace(/^@/, "") ?? "";
    const [status, setStatus] = useState<Status>("loading");
    const [message, setMessage] = useState("noteメンバー権限を有効化しています。");
    const didActivate = useRef(false);

    useEffect(() => {
        if (!isLoaded || didActivate.current) return;

        if (!isSignedIn) {
            router.replace(`/note-entry?noteId=${encodeURIComponent(noteId)}`);
            return;
        }

        if (!noteId) {
            setStatus("error");
            setMessage("note IDが見つかりません。もう一度入力してください。");
            return;
        }

        didActivate.current = true;

        const activate = async () => {
            try {
                const res = await fetch("/api/note-membership/claim", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ noteId }),
                });
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || "noteメンバー登録に失敗しました。");
                }

                if (data.discordRoleWarning) {
                    setStatus("warning");
                    setMessage("LMS権限は有効化しました。Discordロールだけ手動確認が必要です。");
                    return;
                }

                setStatus("success");
                setMessage("登録が完了しました。動画一覧へ移動します。");
                setTimeout(() => router.replace("/videos"), 1600);
            } catch (error) {
                setStatus("error");
                setMessage(error instanceof Error ? error.message : "noteメンバー登録に失敗しました。");
            }
        };

        activate();
    }, [isLoaded, isSignedIn, noteId, router]);

    const isLoading = status === "loading";
    const Icon = status === "error" ? ShieldAlert : status === "success" ? CheckCircle : Loader2;

    return (
        <div className="min-h-screen bg-cream flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-white border-2 border-black brutal-shadow rounded-xl">
                <CardHeader className="items-center text-center">
                    <Icon
                        className={`h-12 w-12 ${isLoading ? "animate-spin text-gray-700" : status === "error" ? "text-red-600" : "text-green-600"}`}
                    />
                    <CardTitle className="text-2xl font-black text-black">
                        {status === "error" ? "登録できませんでした" : "noteメンバー登録"}
                    </CardTitle>
                    <CardDescription className="font-bold text-gray-600">{message}</CardDescription>
                </CardHeader>
                {!isLoading && (
                    <CardContent className="flex flex-col gap-3">
                        {status === "success" ? (
                            <Button asChild className="bg-pop-green text-black border-2 border-black font-black">
                                <Link href="/videos">動画一覧を開く</Link>
                            </Button>
                        ) : (
                            <>
                                <Button asChild className="bg-pop-yellow text-black border-2 border-black font-black">
                                    <Link href={`/note-entry?noteId=${encodeURIComponent(noteId)}`}>もう一度試す</Link>
                                </Button>
                                {status === "warning" && (
                                    <Button asChild variant="outline" className="border-2 border-black font-black">
                                        <Link href="/videos">動画一覧を開く</Link>
                                    </Button>
                                )}
                            </>
                        )}
                    </CardContent>
                )}
            </Card>
        </div>
    );
}

export default function NoteEntryActivatePage() {
    return (
        <Suspense>
            <NoteEntryActivateContent />
        </Suspense>
    );
}
