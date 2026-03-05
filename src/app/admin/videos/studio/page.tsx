"use client";

import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { VideoMerger } from "@/components/admin/VideoMerger";
import { VideoTrimmer } from "@/components/admin/VideoTrimmer";
import { BrutalistLoader } from "@/components/ui/brutalist-loader";
import { api } from "../../../../../convex/_generated/api";

type Tab = "trim" | "merge";

export default function VideoStudioPage() {
    const router = useRouter();
    const userData = useQuery(api.users.getUser);
    const [activeTab, setActiveTab] = useState<Tab>("trim");

    useEffect(() => {
        if (userData !== undefined && !userData?.isAdmin) {
            router.push("/");
        }
    }, [userData, router]);

    if (userData === undefined) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-cream">
                <BrutalistLoader />
            </div>
        );
    }

    if (!userData?.isAdmin) return null;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-black mb-2">動画編集スタジオ</h1>
            <p className="text-sm text-gray-600 mb-8">
                動画のカット（トリミング）や結合（マージ）ができます。Mux Clips APIを使用して処理されます。
            </p>

            {/* タブ */}
            <div className="flex gap-2 mb-8">
                <button
                    type="button"
                    onClick={() => setActiveTab("trim")}
                    className={`px-6 py-3 rounded-lg font-bold text-sm transition-all ${
                        activeTab === "trim"
                            ? "bg-pop-yellow text-black border-2 border-black brutal-shadow"
                            : "bg-gray-100 text-gray-600 border-2 border-transparent hover:border-gray-300"
                    }`}
                >
                    カット（トリミング）
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("merge")}
                    className={`px-6 py-3 rounded-lg font-bold text-sm transition-all ${
                        activeTab === "merge"
                            ? "bg-pop-yellow text-black border-2 border-black brutal-shadow"
                            : "bg-gray-100 text-gray-600 border-2 border-transparent hover:border-gray-300"
                    }`}
                >
                    結合（マージ）
                </button>
            </div>

            {/* コンテンツ */}
            <div className="bg-white p-6 rounded-xl border-2 border-black brutal-shadow">
                {activeTab === "trim" && <VideoTrimmer />}
                {activeTab === "merge" && <VideoMerger />}
            </div>
        </div>
    );
}
