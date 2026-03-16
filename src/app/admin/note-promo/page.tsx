"use client";

import { useMutation, useQuery } from "convex/react";
import { Copy, Link2, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "../../../../convex/_generated/api";

export default function NotePromoAdminPage() {
    // biome-ignore lint/suspicious/noExplicitAny: Convex codegen types not available without `npx convex dev`
    const promoLinks = useQuery((api as any).notePromo.listPromoLinks);
    // biome-ignore lint/suspicious/noExplicitAny: Convex codegen types not available without `npx convex dev`
    const stats = useQuery((api as any).notePromo.getPromoLinkStats);
    // biome-ignore lint/suspicious/noExplicitAny: Convex codegen types not available without `npx convex dev`
    const trialUsers = useQuery((api as any).notePromo.getTrialUsers);
    // biome-ignore lint/suspicious/noExplicitAny: Convex codegen types not available without `npx convex dev`
    const createLink = useMutation((api as any).notePromo.createPromoLink);
    // biome-ignore lint/suspicious/noExplicitAny: Convex codegen types not available without `npx convex dev`
    const rotateLink = useMutation((api as any).notePromo.rotatePromoLink);
    // biome-ignore lint/suspicious/noExplicitAny: Convex codegen types not available without `npx convex dev`
    const deactivateLink = useMutation((api as any).notePromo.deactivatePromoLink);

    const [maxRedemptions, setMaxRedemptions] = useState(100);
    const [isCreating, setIsCreating] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleCreate = async () => {
        setIsCreating(true);
        try {
            await createLink({ maxRedemptions });
        } catch (e) {
            console.error("Failed to create promo link:", e);
        } finally {
            setIsCreating(false);
        }
    };

    const handleCopy = (code: string, id: string) => {
        const url = `${window.location.origin}/invite/${code}`;
        navigator.clipboard.writeText(url);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleRotate = async (linkId: string) => {
        if (!confirm("このリンクを無効化し、新しいリンクを生成しますか？")) return;
        try {
            // biome-ignore lint/suspicious/noExplicitAny: Convex Id type not available without codegen
            await rotateLink({ linkId: linkId as any });
        } catch (e) {
            console.error("Failed to rotate link:", e);
        }
    };

    const handleDeactivate = async (linkId: string) => {
        if (!confirm("このリンクを無効化しますか？")) return;
        try {
            // biome-ignore lint/suspicious/noExplicitAny: Convex Id type not available without codegen
            await deactivateLink({ linkId: linkId as any });
        } catch (e) {
            console.error("Failed to deactivate link:", e);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-black">noteプロモーション管理</h1>
                    <p className="text-gray-500 font-bold mt-1">noteマガジン読者向けプロモリンクの管理</p>
                </div>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
                    {[
                        { label: "総トライアル数", value: stats.totalTrials },
                        { label: "アクティブ", value: stats.activeTrials },
                        { label: "期限切れ", value: stats.expiredTrials },
                        { label: "有料転換", value: stats.convertedTrials },
                        { label: "転換率", value: `${stats.conversionRate}%` },
                    ].map((stat) => (
                        <Card key={stat.label} className="bg-white border-2 border-black brutal-shadow-sm rounded-lg">
                            <CardContent className="pt-4 pb-4">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{stat.label}</p>
                                <p className="text-2xl font-black text-black mt-1">{stat.value}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create New Link */}
            <Card className="bg-white border-2 border-black brutal-shadow rounded-xl">
                <CardHeader>
                    <CardTitle className="font-black">新規プロモリンク生成</CardTitle>
                    <CardDescription className="font-bold">
                        noteマガジン読者向けの招待リンクを生成します
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-end gap-4">
                        <div className="flex-1">
                            <label className="text-sm font-bold text-gray-700 mb-1 block">最大使用回数</label>
                            <Input
                                type="number"
                                value={maxRedemptions}
                                onChange={(e) => setMaxRedemptions(Number(e.target.value))}
                                className="border-2 border-black font-bold"
                                min={1}
                            />
                        </div>
                        <Button
                            onClick={handleCreate}
                            disabled={isCreating}
                            className="bg-pop-green text-black border-2 border-black brutal-shadow-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none font-bold"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            {isCreating ? "生成中..." : "リンク生成"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Links List */}
            <Card className="bg-white border-2 border-black brutal-shadow rounded-xl">
                <CardHeader>
                    <CardTitle className="font-black">プロモリンク一覧</CardTitle>
                </CardHeader>
                <CardContent>
                    {promoLinks === undefined ? (
                        <p className="text-gray-400 font-bold">読み込み中...</p>
                    ) : promoLinks.length === 0 ? (
                        <p className="text-gray-400 font-bold">プロモリンクがありません</p>
                    ) : (
                        <div className="space-y-3">
                            {promoLinks.map((link) => (
                                <div
                                    key={link._id}
                                    className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                                        link.isActive ? "border-green-500 bg-green-50" : "border-gray-300 bg-gray-50"
                                    }`}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <Link2 className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                            <code className="text-sm font-mono font-bold truncate">
                                                /invite/{link.code}
                                            </code>
                                            <span
                                                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                                    link.isActive
                                                        ? "bg-green-200 text-green-800"
                                                        : "bg-gray-200 text-gray-600"
                                                }`}
                                            >
                                                {link.isActive ? "有効" : "無効"}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1 font-bold">
                                            使用: {link.currentRedemptions} / {link.maxRedemptions}
                                            {" · "}
                                            作成: {new Date(link.createdAt).toLocaleDateString("ja-JP")}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleCopy(link.code, link._id)}
                                            className="border-2 border-black font-bold"
                                        >
                                            <Copy className="w-3.5 h-3.5 mr-1" />
                                            {copiedId === link._id ? "コピー済み" : "URL"}
                                        </Button>
                                        {link.isActive && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleRotate(link._id)}
                                                    className="border-2 border-black font-bold"
                                                >
                                                    <RefreshCw className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDeactivate(link._id)}
                                                    className="border-2 border-red-500 text-red-500 font-bold hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Trial Users */}
            <Card className="bg-white border-2 border-black brutal-shadow rounded-xl">
                <CardHeader>
                    <CardTitle className="font-black">トライアルユーザー一覧</CardTitle>
                </CardHeader>
                <CardContent>
                    {trialUsers === undefined ? (
                        <p className="text-gray-400 font-bold">読み込み中...</p>
                    ) : trialUsers.length === 0 ? (
                        <p className="text-gray-400 font-bold">トライアルユーザーがいません</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b-2 border-black">
                                        <th className="text-left py-2 font-black">ユーザー</th>
                                        <th className="text-left py-2 font-black">プロモコード</th>
                                        <th className="text-left py-2 font-black">ステータス</th>
                                        <th className="text-left py-2 font-black">開始日</th>
                                        <th className="text-left py-2 font-black">期限</th>
                                        <th className="text-left py-2 font-black">転換</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {trialUsers.map((trial) => (
                                        <tr key={trial._id} className="border-b border-gray-200">
                                            <td className="py-2 font-bold">{trial.userName}</td>
                                            <td className="py-2">
                                                <code className="text-xs bg-gray-100 px-1 rounded">
                                                    {trial.promoCode}
                                                </code>
                                            </td>
                                            <td className="py-2">
                                                <span
                                                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                                        trial.status === "active"
                                                            ? "bg-green-200 text-green-800"
                                                            : trial.status === "expiring_soon"
                                                              ? "bg-amber-200 text-amber-800"
                                                              : "bg-gray-200 text-gray-600"
                                                    }`}
                                                >
                                                    {trial.status === "active"
                                                        ? "アクティブ"
                                                        : trial.status === "expiring_soon"
                                                          ? "まもなく期限切れ"
                                                          : "期限切れ"}
                                                </span>
                                            </td>
                                            <td className="py-2 text-gray-500">
                                                {new Date(trial.trialStartedAt).toLocaleDateString("ja-JP")}
                                            </td>
                                            <td className="py-2 text-gray-500">
                                                {new Date(trial.trialExpiresAt).toLocaleDateString("ja-JP")}
                                            </td>
                                            <td className="py-2">
                                                {trial.convertedToSubscription ? (
                                                    <span className="text-xs font-bold text-green-600">転換済み</span>
                                                ) : (
                                                    <span className="text-xs text-gray-400">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
