"use client";

import { useAction, useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "../../convex/_generated/api";

interface StripeLinkModalProps {
    triggerClassName?: string;
    triggerLabel?: string;
}

export function StripeLinkModal({ triggerClassName, triggerLabel }: StripeLinkModalProps = {}) {
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const { isAuthenticated } = useConvexAuth();
    const router = useRouter();
    const linkStripeCustomer = useAction(api.stripe.linkStripeCustomerByEmail);

    const handleLink = async () => {
        if (!email.trim()) {
            toast.error("メールアドレスを入力してください");
            return;
        }

        setLoading(true);
        try {
            const result = await linkStripeCustomer({ email: email.trim() });
            if (result.success) {
                toast.success(result.message);
                setOpen(false);
                setEmail("");
            } else {
                toast.error(result.message);
            }
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "連携中にエラーが発生しました");
        } finally {
            setLoading(false);
        }
    };

    const handleDiscordLogin = () => {
        setOpen(false);
        router.push("/login?stripe_link=1");
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="link"
                    className={
                        triggerClassName ??
                        "text-gray-400 hover:text-white text-xs font-bold underline decoration-gray-600 hover:decoration-white transition-all"
                    }
                >
                    {triggerLabel ?? "AIで遊ぼうコミュニティだった方はこちら"}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-black/90 border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle>既存アカウントの連携</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        {isAuthenticated
                            ? "以前「AIで遊ぼう」コミュニティでご利用いただいていた方は、登録時のメールアドレスを入力してください。既存のサブスクリプションを引き継ぎます。"
                            : "以前「AIで遊ぼう」コミュニティでご利用いただいていた方は、まずDiscordでログインしてください。ログイン後にメールアドレスを入力して連携を行います。"}
                    </DialogDescription>
                </DialogHeader>

                {isAuthenticated ? (
                    <>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email" className="text-white">
                                    メールアドレス
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="example@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleLink();
                                    }}
                                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                                />
                                <p className="text-xs text-gray-500">
                                    メールアドレスがご不明な場合は{" "}
                                    <a
                                        href="mailto:taiyo.kimura.3w@stu.hosei.ac.jp"
                                        className="text-blue-400 hover:text-blue-300 underline"
                                    >
                                        taiyo.kimura.3w@stu.hosei.ac.jp
                                    </a>{" "}
                                    までお問い合わせください。
                                </p>
                            </div>
                        </div>
                        <DialogFooter className="gap-2">
                            <Button
                                onClick={() => setOpen(false)}
                                variant="outline"
                                className="border-white/20 text-white hover:bg-white/10"
                            >
                                キャンセル
                            </Button>
                            <Button
                                onClick={handleLink}
                                disabled={loading || !email.trim()}
                                className="bg-blue-600 hover:bg-blue-500 text-white"
                            >
                                {loading ? "連携中..." : "連携する"}
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <DialogFooter className="gap-2 pt-4">
                        <Button
                            onClick={() => setOpen(false)}
                            variant="outline"
                            className="border-white/20 text-white hover:bg-white/10"
                        >
                            キャンセル
                        </Button>
                        <Button onClick={handleDiscordLogin} className="bg-[#5865F2] hover:bg-[#4752C4] text-white">
                            Discordでログインする
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
