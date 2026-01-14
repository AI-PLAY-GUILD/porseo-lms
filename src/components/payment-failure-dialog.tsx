"use client";

import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface PaymentFailureDialogProps {
    subscriptionStatus?: string | null;
}

export function PaymentFailureDialog({ subscriptionStatus }: PaymentFailureDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (subscriptionStatus === "past_due" || subscriptionStatus === "unpaid") {
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    }, [subscriptionStatus]);

    const handleUpdatePayment = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/create-portal-session', {
                method: 'POST',
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert("カスタマーポータルのURL取得に失敗しました。");
            }
        } catch (error) {
            console.error("Failed to redirect to portal:", error);
            alert("エラーが発生しました。");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[425px] bg-white/90 backdrop-blur-md border border-border/50 shadow-soft rounded-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-6 w-6" />
                        <DialogTitle className="font-bold text-lg">お支払いの問題が発生しました</DialogTitle>
                    </div>
                    <DialogDescription className="pt-2 font-medium text-muted-foreground">
                        サブスクリプションの更新に失敗しました。サービスを継続して利用するには、お支払い情報を更新してください。
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="sm:justify-start mt-4">
                    <Button
                        variant="destructive"
                        onClick={handleUpdatePayment}
                        className="w-full sm:w-auto rounded-full font-bold shadow-sm"
                        disabled={loading}
                    >
                        {loading ? "読み込み中..." : "お支払い情報を更新する"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
