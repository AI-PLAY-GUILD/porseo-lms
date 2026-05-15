"use client";

import { useSignIn, useUser } from "@clerk/nextjs";
import { ExternalLink, Link2, PlayCircle } from "lucide-react";
import type { FormEvent } from "react";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function normalizeNoteId(value: string) {
    return value.trim().replace(/^@/, "");
}

function NoteEntryContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user, isLoaded: isUserLoaded } = useUser();
    const { signIn, isLoaded: isSignInLoaded } = useSignIn();
    const [noteId, setNoteId] = useState(() => normalizeNoteId(searchParams.get("noteId") ?? ""));
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const discordAccount = (user?.externalAccounts ?? []).find(
        (acc) => (acc.provider as string) === "oauth_discord" || (acc.provider as string) === "discord",
    );
    const isReady = isUserLoaded && isSignInLoaded;
    const activatePath = useMemo(() => {
        const params = new URLSearchParams({ noteId: normalizeNoteId(noteId) });
        return `/note-entry/activate?${params.toString()}`;
    }, [noteId]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const normalizedNoteId = normalizeNoteId(noteId);
        setError(null);

        if (!normalizedNoteId) {
            setError("note IDを入力してください。");
            return;
        }
        if (!isReady) return;

        setIsSubmitting(true);
        try {
            if (user && discordAccount) {
                router.push(activatePath);
                return;
            }

            if (user && !discordAccount) {
                await user.createExternalAccount({
                    strategy: "oauth_discord",
                    redirectUrl: `/sso-callback?redirect_url=${encodeURIComponent(activatePath)}`,
                });
                return;
            }

            await signIn.authenticateWithRedirect({
                strategy: "oauth_discord",
                redirectUrl: "/sso-callback",
                redirectUrlComplete: activatePath,
            });
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : "登録に失敗しました。");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-cream flex items-center justify-center p-4">
            <main className="w-full max-w-xl">
                <Card className="bg-white border-2 border-black brutal-shadow rounded-xl">
                    <CardHeader className="space-y-3">
                        <div className="inline-flex w-fit items-center gap-2 rounded-full border-2 border-black bg-pop-yellow px-3 py-1 text-xs font-black">
                            <PlayCircle className="h-4 w-4" />
                            noteメンバー専用
                        </div>
                        <CardTitle className="text-3xl font-black text-black">AI PLAY GUILD 参加登録</CardTitle>
                        <CardDescription className="font-bold text-gray-600">
                            note IDを入力してDiscordで登録すると、LMSの動画一覧とDiscordコミュニティに進めます。
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="noteId" className="font-black">
                                    note ID
                                </Label>
                                <div className="relative">
                                    <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                                    <Input
                                        id="noteId"
                                        value={noteId}
                                        onChange={(event) => setNoteId(event.target.value)}
                                        placeholder="例: ai_play_guild"
                                        className="border-2 border-black pl-9 font-bold"
                                        required
                                    />
                                </div>
                            </div>

                            {error && <p className="text-sm font-bold text-red-700">{error}</p>}

                            <Button
                                type="submit"
                                disabled={!isReady || isSubmitting}
                                className="w-full bg-[#5865F2] text-white border-2 border-black font-black brutal-shadow-sm"
                            >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                {isSubmitting ? "登録中..." : "Discordで登録して動画一覧へ進む"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

export default function NoteEntryPage() {
    return (
        <Suspense>
            <NoteEntryContent />
        </Suspense>
    );
}
