import React from "react";

interface Chapter {
    title: string;
    startTime: number;
    description?: string;
}

interface ChapterListProps {
    chapters: Chapter[];
    onChange: (chapters: Chapter[]) => void;
}

export function ChapterList({ chapters, onChange }: ChapterListProps) {
    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">チャプター</label>
                <button
                    type="button"
                    onClick={() => onChange([...chapters, { title: "", startTime: 0, description: "" }])}
                    className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-300"
                >
                    + 追加
                </button>
            </div>
            <div className="space-y-3">
                {chapters.map((chapter, index) => (
                    <div key={index} className="flex gap-2 items-start bg-gray-50 dark:bg-gray-900 p-3 rounded border dark:border-gray-700">
                        <div className="w-20">
                            <label className="text-xs text-gray-500 block">開始(秒)</label>
                            <input
                                type="number"
                                value={chapter.startTime}
                                onChange={(e) => {
                                    const newChapters = [...chapters];
                                    newChapters[index].startTime = Number(e.target.value);
                                    onChange(newChapters);
                                }}
                                className="w-full p-1 border rounded text-sm"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs text-gray-500 block">タイトル</label>
                            <input
                                type="text"
                                value={chapter.title}
                                onChange={(e) => {
                                    const newChapters = [...chapters];
                                    newChapters[index].title = e.target.value;
                                    onChange(newChapters);
                                }}
                                className="w-full p-1 border rounded text-sm mb-1"
                                placeholder="タイトル"
                            />
                            <input
                                type="text"
                                value={chapter.description || ""}
                                onChange={(e) => {
                                    const newChapters = [...chapters];
                                    newChapters[index].description = e.target.value;
                                    onChange(newChapters);
                                }}
                                className="w-full p-1 border rounded text-xs text-gray-500"
                                placeholder="説明（任意）"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                const newChapters = chapters.filter((_, i) => i !== index);
                                onChange(newChapters);
                            }}
                            className="text-red-500 hover:text-red-700 p-1"
                        >
                            ✕
                        </button>
                    </div>
                ))}
                {chapters.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">チャプターがありません</p>
                )}
            </div>
        </div>
    );
}
