"use client";

import { useAction } from "convex/react";
import { useCallback, useRef, useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { SortOption } from "./VideoSearchSort";

interface VideoLike {
    _id: string;
    _creationTime: number;
    title: string;
    description?: string | null;
    summary?: string | null;
    createdAt: number;
    views?: number;
    [key: string]: unknown;
}

interface RagResult {
    videoId: string;
    score: number;
}

export function useVideoSearch<T extends VideoLike>(
    videos: T[] | undefined,
    options: {
        isAdmin?: boolean;
    } = {},
) {
    const [query, setQuery] = useState("");
    const [sortBy, setSortBy] = useState<SortOption>("newest");
    const [ragResults, setRagResults] = useState<RagResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    const searchAuthenticated = useAction(api.rag.searchTranscriptionsAuthenticated);
    const searchAdmin = useAction(api.rag.searchTranscriptionsAdmin);

    const performRagSearch = useCallback(
        async (q: string) => {
            if (!q || q.length < 2) {
                setRagResults([]);
                setIsSearching(false);
                return;
            }
            setIsSearching(true);
            try {
                const searchFn = options.isAdmin ? searchAdmin : searchAuthenticated;
                const results = await searchFn({ query: q, limit: 20 });
                // De-duplicate by videoId, keep highest score
                const map = new Map<string, number>();
                for (const r of results) {
                    const existing = map.get(r.videoId);
                    if (!existing || r.score > existing) {
                        map.set(r.videoId, r.score);
                    }
                }
                setRagResults(Array.from(map.entries()).map(([videoId, score]) => ({ videoId, score })));
            } catch {
                setRagResults([]);
            } finally {
                setIsSearching(false);
            }
        },
        [options.isAdmin, searchAdmin, searchAuthenticated],
    );

    const handleQueryChange = useCallback(
        (newQuery: string) => {
            setQuery(newQuery);
            if (debounceRef.current) clearTimeout(debounceRef.current);
            if (!newQuery) {
                setRagResults([]);
                setIsSearching(false);
                return;
            }
            debounceRef.current = setTimeout(() => {
                performRagSearch(newQuery);
            }, 500);
        },
        [performRagSearch],
    );

    const getMatchType = useCallback(
        (videoId: string): "keyword" | "rag" | "both" | null => {
            if (!query || !videos) return null;
            const lowerQuery = query.toLowerCase();
            const video = videos.find((v) => v._id === videoId);
            const keywordMatch =
                video &&
                (video.title.toLowerCase().includes(lowerQuery) ||
                    video.description?.toLowerCase().includes(lowerQuery) ||
                    video.summary?.toLowerCase().includes(lowerQuery));
            const ragMatch = ragResults.some((r) => r.videoId === videoId);

            if (keywordMatch && ragMatch) return "both";
            if (keywordMatch) return "keyword";
            if (ragMatch) return "rag";
            return null;
        },
        [query, videos, ragResults],
    );

    const sortedVideos = (() => {
        if (!videos) return [];

        let filtered = [...videos];

        // Filter by search query
        if (query) {
            const lowerQuery = query.toLowerCase();
            const ragVideoIds = new Set(ragResults.map((r) => r.videoId));

            filtered = filtered.filter((video) => {
                const keywordMatch =
                    video.title.toLowerCase().includes(lowerQuery) ||
                    video.description?.toLowerCase().includes(lowerQuery) ||
                    video.summary?.toLowerCase().includes(lowerQuery);
                const ragMatch = ragVideoIds.has(video._id);
                return keywordMatch || ragMatch;
            });

            // If we have RAG results, sort by RAG score first
            if (ragResults.length > 0) {
                const scoreMap = new Map(ragResults.map((r) => [r.videoId, r.score]));
                filtered.sort((a, b) => {
                    const scoreA = scoreMap.get(a._id) ?? -1;
                    const scoreB = scoreMap.get(b._id) ?? -1;
                    if (scoreA !== scoreB) return scoreB - scoreA;
                    return 0;
                });
                return filtered;
            }
        }

        // Sort
        switch (sortBy) {
            case "newest":
                filtered.sort((a, b) => b.createdAt - a.createdAt);
                break;
            case "oldest":
                filtered.sort((a, b) => a.createdAt - b.createdAt);
                break;
            case "title":
                filtered.sort((a, b) => a.title.localeCompare(b.title, "ja"));
                break;
            case "views":
                filtered.sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
                break;
        }

        return filtered;
    })();

    return {
        query,
        setQuery: handleQueryChange,
        sortBy,
        setSortBy,
        sortedVideos,
        isSearching,
        getMatchType,
        resultCount: query ? sortedVideos.length : undefined,
        totalCount: videos?.length,
    };
}
