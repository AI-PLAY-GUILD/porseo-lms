"use client";

import { useState } from "react";
import { useAction } from "convex/react";
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

    const handleLink = async () => {
        if (!email) {
            toast.error("メールアドレスを入力してください。");
            return;
        }

        setLoading(true);
        try {
            const result = await linkStripeCustomer({ email });
            if (result.success) {
                toast.success(result.message);
                setOpen(false);
                // リロードして最新の状態を反映させる
                window.location.reload();
            } else {
                toast.error(result.message);
                // 失敗時のメッセージにDiscordへの連絡を促す文言を追加
                toast.error("連携に失敗しました。Shun PORSEO運営にDiscordで連絡してください。");
            }
        } catch (error) {
            console.error("Failed to link Stripe customer:", error);
            toast.error("エラーが発生しました。Shun PORSEO運営にDiscordで連絡してください。");
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
                        Discordアカウントと紐付けを行います。
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
                        {loading ? "連携中..." : "連携する"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
