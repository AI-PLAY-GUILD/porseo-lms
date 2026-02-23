"use client";

import { useAction } from "convex/react";
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

export function StripeLinkModal() {
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
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

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="link"
                    className="text-gray-400 hover:text-white text-xs font-bold underline decoration-gray-600 hover:decoration-white transition-all"
                >
                    AIで遊ぼうコミュニティだった方はこちら
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-black/90 border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle>既存アカウントの連携</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        以前「AIで遊ぼう」コミュニティでご利用いただいていた方は、
                        登録時のメールアドレスを入力してください。 既存のサブスクリプションを引き継ぎます。
                    </DialogDescription>
                </DialogHeader>
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
            </DialogContent>
        </Dialog>
    );
}
