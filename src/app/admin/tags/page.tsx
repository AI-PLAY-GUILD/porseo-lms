"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";

export default function TagsPage() {
    const tags = useQuery(api.tags.getTags);
    const createTag = useMutation(api.tags.createTag);
    const deleteTag = useMutation(api.tags.deleteTag);

    const [newName, setNewName] = useState("");

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createTag({ name: newName });
            setNewName("");
            alert("タグを作成しました");
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "不明なエラーが発生しました";
            alert(`エラー: ${errorMessage}`);
        }
    };

    const handleDelete = async (tagId: any) => {
        if (!confirm("このタグを削除しますか？")) return;
        try {
            await deleteTag({ tagId });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "不明なエラーが発生しました";
            alert(`エラー: ${errorMessage}`);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-8">タグ管理</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Create Tag Form */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm h-fit">
                    <h2 className="text-lg font-bold mb-4">新規タグ作成</h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <Label htmlFor="name">タグ名</Label>
                            <Input
                                id="name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="例: 初心者向け"
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full">作成する</Button>
                    </form>
                </div>

                {/* Tag List */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm">
                    <h2 className="text-lg font-bold mb-4">タグ一覧</h2>
                    {tags === undefined ? (
                        <p>読み込み中...</p>
                    ) : tags.length === 0 ? (
                        <p className="text-gray-500">タグがありません。</p>
                    ) : (
                        <div className="space-y-2">
                            {tags.map((tag) => (
                                <div key={tag._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded border">
                                    <div>
                                        <p className="font-medium">{tag.name}</p>
                                        <p className="text-xs text-gray-500">{tag.slug}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(tag._id)}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
