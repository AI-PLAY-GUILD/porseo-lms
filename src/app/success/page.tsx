"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function SuccessPage() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("session_id");
    const [_syncStatus, setSyncStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [_errorMessage, setErrorMessage] = useState("");

    // Replace this with your actual Discord Invite URL or Server URL
    // You can also add NEXT_PUBLIC_DISCORD_INVITE_URL to your .env.local
    const discordUrl = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "https://discord.com/app";

    const _handleSyncRole = async () => {
        setSyncStatus("loading");
        setErrorMessage("");
        try {
            const res = await fetch("/api/sync-role", { method: "POST" });
            const data = await res.json();

            if (res.ok) {
                setSyncStatus("success");
            } else {
                setSyncStatus("error");
                setErrorMessage(data.error || "Failed to sync role");
            }
        } catch (_e) {
            setSyncStatus("error");
            setErrorMessage("An error occurred");
        }
    };

    return (
        <main className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-6 p-8 rounded-2xl bg-neutral-900/50 border border-neutral-800 backdrop-blur-xl">
                <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <h1 className="text-3xl font-bold">Payment Successful!</h1>
                <p className="text-neutral-400">Thank you for joining. Your membership is now active.</p>

                {sessionId && (
                    <p className="text-xs text-neutral-600 font-mono">Session ID: {sessionId.slice(0, 10)}...</p>
                )}

                <div className="flex flex-col gap-3">
                    <a
                        href={discordUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-6 py-3 bg-[#5865F2] text-white font-semibold rounded-full hover:bg-[#4752C4] transition-colors"
                    >
                        Go to Discord Server
                    </a>

                    {/* <button
                        onClick={handleSyncRole}
                        disabled={syncStatus === 'loading' || syncStatus === 'success'}
                        className={`inline-block px-6 py-3 font-semibold rounded-full transition-colors ${syncStatus === 'success'
                                ? 'bg-green-600 text-white'
                                : 'bg-neutral-800 text-white hover:bg-neutral-700'
                            }`}
                    >
                        {syncStatus === 'loading' ? 'Syncing...' :
                            syncStatus === 'success' ? 'Role Assigned!' : '2. Get Discord Role'}
                    </button>

                    {syncStatus === 'error' && (
                        <p className="text-sm text-red-400">{errorMessage}</p>
                    )} */}

                    <Link
                        href="/"
                        className="inline-block px-6 py-3 bg-transparent text-neutral-400 font-semibold rounded-full hover:text-white transition-colors"
                    >
                        Return to Home
                    </Link>
                </div>
            </div>
        </main>
    );
}
