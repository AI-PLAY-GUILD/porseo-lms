"use client";

import { useQuery } from "convex/react";
import { CheckCircle, FileUp, XCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "../../../../convex/_generated/api";

type CsvRow = {
    noteId: string;
    memberNumber?: string;
    planName?: string;
    externalAccount?: string;
};

function parseCsv(text: string) {
    const rows: string[][] = [];
    let field = "";
    let row: string[] = [];
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const next = text[i + 1];

        if (char === '"' && inQuotes && next === '"') {
            field += '"';
            i++;
        } else if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
            row.push(field);
            field = "";
        } else if ((char === "\n" || char === "\r") && !inQuotes) {
            if (char === "\r" && next === "\n") i++;
            row.push(field);
            if (row.some((value) => value.trim())) rows.push(row);
            row = [];
            field = "";
        } else {
            field += char;
        }
    }

    row.push(field);
    if (row.some((value) => value.trim())) rows.push(row);
    return rows;
}

function normalizeHeader(header: string) {
    return header.trim().toLowerCase().replace(/\s|_|-/g, "");
}

function pickValue(row: Record<string, string>, candidates: string[]) {
    for (const candidate of candidates) {
        const value = row[normalizeHeader(candidate)]?.trim();
        if (value) return value;
    }
    return undefined;
}

function mapCsvRows(text: string): CsvRow[] {
    const parsed = parseCsv(text);
    if (parsed.length < 2) return [];

    const headers = parsed[0].map(normalizeHeader);
    return parsed
        .slice(1)
        .map((columns) => {
            const row = Object.fromEntries(headers.map((header, index) => [header, columns[index] ?? ""]));
            return {
                noteId: pickValue(row, ["note id", "noteid", "note_id", "noteID"]) ?? "",
                memberNumber: pickValue(row, ["会員番号", "会員No", "member number", "memberNumber"]),
                planName: pickValue(row, ["加入プラン", "プラン", "plan", "planName"]),
                externalAccount: pickValue(row, ["外部サービスアカウント", "外部サービス", "external account"]),
            };
        })
        .filter((row) => row.noteId);
}

const statusLabel: Record<string, string> = {
    active: "有効",
    confirmed: "確認済み",
    review: "確認待ち",
    rejected: "停止中",
};

export default function NoteMembershipAdminPage() {
    const claims = useQuery(api.noteMembership.listClaims);
    const stats = useQuery(api.noteMembership.getStats);
    const [rows, setRows] = useState<CsvRow[]>([]);
    const [revokeMissing, setRevokeMissing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFile = async (file: File | undefined) => {
        setMessage(null);
        setError(null);
        if (!file) return;

        const text = await file.text();
        const mappedRows = mapCsvRows(text);
        setRows(mappedRows);
        setMessage(`${mappedRows.length}件のnote IDを読み込みました。`);
    };

    const handleImport = async () => {
        setIsImporting(true);
        setMessage(null);
        setError(null);
        try {
            const res = await fetch("/api/admin/note-membership/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rows, revokeMissing }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "CSV取り込みに失敗しました");
            setMessage(
                `照合完了: 一致 ${data.result.matchedCount}件 / 未一致 ${data.result.unmatchedCount}件 / 停止 ${data.result.rejectedCount}件`,
            );
        } catch (importError) {
            setError(importError instanceof Error ? importError.message : "CSV取り込みに失敗しました");
        } finally {
            setIsImporting(false);
        }
    };

    const updateStatus = async (claimId: string, status: string) => {
        setMessage(null);
        setError(null);
        try {
            const res = await fetch("/api/admin/note-membership/status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ claimId, status }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "ステータス更新に失敗しました");
            setMessage("ステータスを更新しました。");
        } catch (statusError) {
            setError(statusError instanceof Error ? statusError.message : "ステータス更新に失敗しました");
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black text-black">noteメンバー連携</h1>
                <p className="text-gray-500 font-bold mt-1">申請済みnote会員の確認とCSV監査</p>
            </div>

            {stats && (
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
                    {[
                        { label: "総申請", value: stats.total },
                        { label: "有効", value: stats.active },
                        { label: "確認済み", value: stats.confirmed },
                        { label: "確認待ち", value: stats.review },
                        { label: "停止", value: stats.rejected },
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

            <Card className="bg-white border-2 border-black brutal-shadow rounded-xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-black">
                        <FileUp className="w-5 h-5" />
                        note CSV取り込み
                    </CardTitle>
                    <CardDescription className="font-bold">
                        noteのメンバーCSVを取り込み、note IDが一致する申請を確認済みにします。
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Input
                        type="file"
                        accept=".csv,text/csv"
                        className="border-2 border-black"
                        onChange={(event) => handleFile(event.target.files?.[0])}
                    />
                    <label className="flex items-center gap-2 text-sm font-bold">
                        <input
                            type="checkbox"
                            checked={revokeMissing}
                            onChange={(event) => setRevokeMissing(event.target.checked)}
                        />
                        CSVに存在しない有効申請を停止する
                    </label>
                    <Button
                        onClick={handleImport}
                        disabled={rows.length === 0 || isImporting}
                        className="bg-pop-green text-black border-2 border-black font-black brutal-shadow-sm"
                    >
                        {isImporting ? "取り込み中..." : `${rows.length}件を照合する`}
                    </Button>
                    {message && <p className="text-sm font-bold text-green-700">{message}</p>}
                    {error && <p className="text-sm font-bold text-red-700">{error}</p>}
                </CardContent>
            </Card>

            <Card className="bg-white border-2 border-black brutal-shadow rounded-xl">
                <CardHeader>
                    <CardTitle className="font-black">申請一覧</CardTitle>
                </CardHeader>
                <CardContent>
                    {claims === undefined ? (
                        <p className="font-bold text-gray-500">読み込み中...</p>
                    ) : claims.length === 0 ? (
                        <p className="font-bold text-gray-500">note申請はまだありません。</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b-2 border-black">
                                        <th className="text-left py-2 font-black">ユーザー</th>
                                        <th className="text-left py-2 font-black">note ID</th>
                                        <th className="text-left py-2 font-black">プラン</th>
                                        <th className="text-left py-2 font-black">状態</th>
                                        <th className="text-left py-2 font-black">確認日</th>
                                        <th className="text-left py-2 font-black">操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {claims.map((claim) => (
                                        <tr key={claim._id} className="border-b border-gray-200">
                                            <td className="py-3 pr-4">
                                                <div className="font-bold">{claim.userName}</div>
                                                <div className="text-xs text-gray-500">{claim.userEmail}</div>
                                            </td>
                                            <td className="py-3 pr-4 font-bold">{claim.noteId}</td>
                                            <td className="py-3 pr-4">{claim.planName || "-"}</td>
                                            <td className="py-3 pr-4">
                                                <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold">
                                                    {claim.status === "rejected" ? (
                                                        <XCircle className="w-3 h-3 text-red-600" />
                                                    ) : (
                                                        <CheckCircle className="w-3 h-3 text-green-600" />
                                                    )}
                                                    {statusLabel[claim.status] ?? claim.status}
                                                </span>
                                            </td>
                                            <td className="py-3 pr-4">
                                                {claim.lastVerifiedAt
                                                    ? new Date(claim.lastVerifiedAt).toLocaleDateString("ja-JP")
                                                    : "-"}
                                            </td>
                                            <td className="py-3 pr-4">
                                                <div className="flex flex-wrap gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-2 border-black font-bold"
                                                        onClick={() => updateStatus(claim._id, "confirmed")}
                                                    >
                                                        確認済み
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-2 border-black font-bold"
                                                        onClick={() => updateStatus(claim._id, "active")}
                                                    >
                                                        有効
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-2 border-red-500 text-red-600 font-bold"
                                                        onClick={() => updateStatus(claim._id, "rejected")}
                                                    >
                                                        停止
                                                    </Button>
                                                </div>
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
