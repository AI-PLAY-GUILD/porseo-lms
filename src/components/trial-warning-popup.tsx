"use client";

import { useQuery } from "convex/react";
import { AlertTriangle, ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";

// biome-ignore lint/suspicious/noExplicitAny: Convex codegen not available without `npx convex dev`
const getTrialStatusRef = (api as any).notePromo?.getTrialStatus ?? "skip";

export function TrialWarningPopup() {
    const trialStatus = useQuery(getTrialStatusRef === "skip" ? "skip" : getTrialStatusRef);
    const [dismissed, setDismissed] = useState(true); // Start dismissed to prevent flash

    useEffect(() => {
        if (!trialStatus || trialStatus.status !== "expiring_soon") {
            setDismissed(true);
            return;
        }

        // Check localStorage for daily dismiss
        const key = "trial_warning_dismissed";
        const lastDismissed = localStorage.getItem(key);
        if (lastDismissed) {
            const dismissedDate = new Date(lastDismissed).toDateString();
            const today = new Date().toDateString();
            if (dismissedDate === today) {
                setDismissed(true);
                return;
            }
        }
        setDismissed(false);
    }, [trialStatus]);

    const handleDismiss = () => {
        localStorage.setItem("trial_warning_dismissed", new Date().toISOString());
        setDismissed(true);
    };

    if (dismissed || !trialStatus || trialStatus.status !== "expiring_soon") {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="relative mx-4 w-full max-w-md rounded-2xl border border-amber-200 bg-white p-6 shadow-2xl">
                <button
                    onClick={handleDismiss}
                    className="absolute right-3 top-3 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
                        <AlertTriangle className="h-7 w-7 text-amber-600" />
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-gray-900">
                            無料体験があと{trialStatus.daysRemaining}日で終了します
                        </h3>
                        <p className="mt-2 text-sm text-gray-500">
                            引き続きAI PLAY GUILDで学習を続けるには、有料メンバーシップへの登録をお勧めします。
                        </p>
                    </div>

                    <div className="flex w-full flex-col gap-2">
                        <Link
                            href="/join"
                            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-400 to-cyan-500 px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
                        >
                            有料メンバーになる
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                        <button
                            onClick={handleDismiss}
                            className="rounded-xl px-4 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
                        >
                            後で
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
