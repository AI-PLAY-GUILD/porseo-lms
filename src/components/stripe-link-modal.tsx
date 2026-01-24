"use client";

import { useState, useEffect } from "react";
import { useAction, useConvex } from "convex/react";
import { useClerk, useUser } from "@clerk/nextjs";
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
    // const linkStripeCustomer = useAction(api.stripe.linkStripeCustomerByEmail); // Removed for security
    const convex = useConvex();
    const { openSignIn } = useClerk();
    const { user } = useUser();
    const router = useRouter();

    useEffect(() => {
        // Feature disabled
    }, []);

    const handleLink = async () => {
        toast.error("現在、セキュリティ強化のため自動連携機能を停止しています。連携希望の方はDiscordで運営にお問い合わせください。");
        setOpen(false);
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
                        現在、セキュリティ強化のため自動連携機能を停止しています。
                        <br />
                        お手数ですが、Discordにて運営までお問い合わせください。
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button onClick={() => setOpen(false)} className="bg-gray-600 hover:bg-gray-500 text-white">
                        閉じる
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
