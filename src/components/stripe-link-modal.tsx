"use client";

import { useState, useEffect } from "react";
import { useAction, useConvex } from "convex/react";
import { useSignIn, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { api } from "../../convex/_generated/api";
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
import { toast } from "sonner";

export function StripeLinkModal() {
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const linkStripeCustomer = useAction(api.stripe.linkStripeCustomerByEmail);
    const convex = useConvex();
    const { signIn } = useSignIn();
    const { user } = useUser();
    const router = useRouter();

    useEffect(() => {
        const checkPendingLink = async () => {
            if (user && typeof window !== "undefined") {
                const pendingEmail = sessionStorage.getItem("pending_stripe_link_email");
                if (pendingEmail) {
                    setLoading(true);
                    try {
                        // 少し待ってから実行（ユーザー情報の同期待ちなど）
                        await new Promise(resolve => setTimeout(resolve, 1000));

                        const result = await linkStripeCustomer({ email: pendingEmail });
                        if (result.success) {
                            toast.success(result.message);
                            sessionStorage.removeItem("pending_stripe_link_email");
                            router.push("/dashboard");
                        } else {
                            toast.error(result.message);
                            // 失敗してもセッションストレージはクリアする（ループ防止）
                            sessionStorage.removeItem("pending_stripe_link_email");
                        }
                    } catch (error) {
                        console.error("Failed to auto-link:", error);
                        toast.error("連携に失敗しました。");
                        sessionStorage.removeItem("pending_stripe_link_email");
                    } finally {
                        setLoading(false);
                    }
                }
            }
        };

        checkPendingLink();
    }, [user, linkStripeCustomer]);

    const handleLink = async () => {
        if (!email) {
            toast.error("メールアドレスを入力してください。");
            return;
        }

        setLoading(true);
        try {
            // 1. ログイン済みの場合：そのまま連携処理
            if (user) {
                const result = await linkStripeCustomer({ email });
                if (result.success) {
                    toast.success(result.message);
                    setOpen(false);
                    router.push("/dashboard");
                } else {
                    toast.error(result.message);
                    toast.error("連携に失敗しました。Shun PORSEO運営にDiscordで連絡してください。");
                }
                return;
            }

            // 2. 未ログインの場合：メールアドレスの存在確認 -> ログイン誘導
            const exists = await convex.query(api.users.checkUserByEmail, { email });

            if (exists) {
                // メールアドレスが存在する場合、セッションストレージに保存してログインへ
                sessionStorage.setItem("pending_stripe_link_email", email);
                toast.info("アカウントが見つかりました。Discordでログインしてください。");

                if (signIn) {
                    await signIn.authenticateWithRedirect({
                        strategy: "oauth_discord",
                        redirectUrl: "/join",
                        redirectUrlComplete: "/join",
                    });
                }
            } else {
                toast.error("入力されたメールアドレスのアカウントが見つかりません。");
            }

        } catch (error) {
            console.error("Failed to process link request:", error);
            toast.error("エラーが発生しました。");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="link" className="text-gray-400 hover:text-white text-xs font-bold underline decoration-gray-600 hover:decoration-white transition-all">
                    AIで遊ぼうコミュニティだった方はこちら
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-black/90 border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle>既存アカウントの連携</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Stripeで決済済みのメールアドレスを入力してください。
                        <br />
                        アカウント確認後、Discordログインへ移動します。
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                            Email
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="stripe@example.com"
                            className="col-span-3 bg-white/5 border-white/10 text-white"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleLink} disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white">
                        {loading ? "処理中..." : (user ? "連携する" : "確認してログイン")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
