"use client";

import { Loader2, Search, X } from "lucide-react";

export type SortOption = "newest" | "oldest" | "title" | "views";

interface VideoSearchSortProps {
    query: string;
    onQueryChange: (query: string) => void;
    sortBy: SortOption;
    onSortChange: (sort: SortOption) => void;
    isSearching?: boolean;
    showViewsSort?: boolean;
    resultCount?: number;
    totalCount?: number;
}

const sortLabels: Record<SortOption, string> = {
    newest: "新しい順",
    oldest: "古い順",
    title: "タイトル順",
    views: "視聴回数順",
};

export function VideoSearchSort({
    query,
    onQueryChange,
    sortBy,
    onSortChange,
    isSearching,
    showViewsSort,
    resultCount,
    totalCount,
}: VideoSearchSortProps) {
    const sortOptions: SortOption[] = showViewsSort
        ? ["newest", "oldest", "title", "views"]
        : ["newest", "oldest", "title"];

    return (
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            {/* 検索Input */}
            <div className="relative flex-1 w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                    placeholder="動画を検索（キーワード・文字起こし）..."
                    className="w-full pl-10 pr-10 py-2 border-2 border-black rounded-lg bg-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-pop-yellow focus:border-black placeholder:font-normal placeholder:text-gray-400"
                />
                {isSearching && (
                    <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-pop-purple animate-spin" />
                )}
                {query && (
                    <button
                        onClick={() => onQueryChange("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* ソートSelect */}
            <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value as SortOption)}
                className="border-2 border-black rounded-lg px-3 py-2 bg-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-pop-yellow cursor-pointer"
            >
                {sortOptions.map((opt) => (
                    <option key={opt} value={opt}>
                        {sortLabels[opt]}
                    </option>
                ))}
            </select>

            {/* 検索結果件数 */}
            {query && resultCount !== undefined && totalCount !== undefined && (
                <span className="text-sm font-bold text-gray-500 whitespace-nowrap">
                    {resultCount}/{totalCount}件
                </span>
            )}
        </div>
    );
}
