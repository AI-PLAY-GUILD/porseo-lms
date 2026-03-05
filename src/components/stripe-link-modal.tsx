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
    const [customerName, setCustomerName] = useState("");
    const [step, setStep] = useState<"email" | "name">("email");
    const [loading, setLoading] = useState(false);
    const { isAuthenticated } = useConvexAuth();
    const router = useRouter();
    const linkStripeCustomer = useAction(api.stripe.linkStripeCustomerByEmail);

    const handleLink = async (nameOverride?: string) => {
        if (!email.trim()) {
            toast.error("メールアドレスを入力してください");
            return;
        }

        if (step === "name" && !customerName.trim() && !nameOverride) {
            toast.error("お名前を入力してください");
            return;
        }

        setLoading(true);
        try {
            const result = await linkStripeCustomer({
                email: email.trim(),
                customerName: step === "name" ? nameOverride || customerName.trim() : undefined,
            });
            if (result.success) {
                toast.success(result.message);
                handleClose();
                router.push("/dashboard");
            } else if (result.needsVerification) {
                setStep("name");
                toast.info(result.message);
            } else {
                toast.error(result.message);
            }
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "連携中にエラーが発生しました");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setOpen(false);
        setEmail("");
        setCustomerName("");
        setStep("email");
    };

    const handleDiscordLogin = () => {
        handleClose();
        router.push("/login?stripe_link=1");
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                if (!v) handleClose();
                else setOpen(true);
            }}
        >
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
                            ? step === "email"
                                ? "以前「AIで遊ぼう」コミュニティでご利用いただいていた方は、登録時のメールアドレスを入力してください。既存のサブスクリプションを引き継ぎます。"
                                : "ログイン中のメールアドレスと異なるため、本人確認が必要です。Stripeに登録されているお名前を入力してください。"
                            : "以前「AIで遊ぼう」コミュニティでご利用いただいていた方は、まずDiscordでログインしてください。ログイン後にメールアドレスを入力して連携を行います。"}
                    </DialogDescription>
                </DialogHeader>

                {isAuthenticated ? (
                    <>
                        <div className="grid gap-4 py-4">
                            {step === "email" ? (
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
                            ) : (
                                <div className="grid gap-2">
                                    <div className="rounded-md bg-white/5 border border-white/10 p-3 mb-1">
                                        <p className="text-xs text-gray-400">入力されたメールアドレス</p>
                                        <p className="text-sm text-white">{email}</p>
                                    </div>
                                    <Label htmlFor="customerName" className="text-white">
                                        Stripeに登録されているお名前
                                    </Label>
                                    <Input
                                        id="customerName"
                                        type="text"
                                        placeholder="山田 太郎"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") handleLink();
                                        }}
                                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                                        autoFocus
                                    />
                                    <p className="text-xs text-gray-500">
                                        決済時に登録したお名前を正確に入力してください。
                                    </p>
                                </div>
                            )}
                        </div>
                        <DialogFooter className="gap-2">
                            {step === "name" && (
                                <Button
                                    onClick={() => {
                                        setStep("email");
                                        setCustomerName("");
                                    }}
                                    variant="ghost"
                                    className="text-gray-400 hover:text-white hover:bg-white/10 mr-auto"
                                >
                                    戻る
                                </Button>
                            )}
                            <Button
                                onClick={handleClose}
                                variant="outline"
                                className="border-white/20 text-white hover:bg-white/10"
                            >
                                キャンセル
                            </Button>
                            <Button
                                onClick={() => handleLink()}
                                disabled={loading || (step === "email" ? !email.trim() : !customerName.trim())}
                                className="bg-blue-600 hover:bg-blue-500 text-white"
                            >
                                {loading ? "連携中..." : step === "email" ? "次へ" : "連携する"}
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <DialogFooter className="gap-2 pt-4">
                        <Button
                            onClick={handleClose}
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
