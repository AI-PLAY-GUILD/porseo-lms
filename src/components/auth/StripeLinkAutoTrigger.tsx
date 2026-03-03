"use client";

import { useAction, useConvexAuth } from "convex/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "../../../convex/_generated/api";

export default function StripeLinkAutoTrigger() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated } = useConvexAuth();
    const linkStripeCustomer = useAction(api.stripe.linkStripeCustomerByEmail);

    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const isStripeLink = searchParams.get("stripe_link") === "1";

    // Auto-open dialog when stripe_link=1 and authenticated
    useEffect(() => {
        if (isStripeLink && isAuthenticated) {
            setOpen(true);
        }
    }, [isStripeLink, isAuthenticated]);

    const removeStripeLinkParam = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("stripe_link");
        const newQuery = params.toString();
        router.replace(newQuery ? `${pathname}?${newQuery}` : pathname);
    };

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
            } else {
                toast.error(result.message);
            }
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Stripe連携中にエラーが発生しました");
        } finally {
            setLoading(false);
            setOpen(false);
            setEmail("");
            removeStripeLinkParam();
        }
    };

    const handleClose = () => {
        setOpen(false);
        setEmail("");
        removeStripeLinkParam();
    };

    if (!isStripeLink || !isAuthenticated) return null;

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                if (!v) handleClose();
            }}
        >
            <DialogContent className="sm:max-w-[425px] bg-black/90 border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle>既存アカウントの連携</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        以前「AIで遊ぼう」コミュニティでご利用いただいていた方は、
                        登録時のメールアドレスを入力してください。既存のサブスクリプションを引き継ぎます。
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="stripe-link-email" className="text-white">
                            メールアドレス
                        </Label>
                        <Input
                            id="stripe-link-email"
                            type="email"
                            placeholder="example@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleLink();
                            }}
                            className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                            autoFocus
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
                        onClick={handleClose}
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
