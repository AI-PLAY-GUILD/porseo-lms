"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Bot, ExternalLink, Play, Send, Sparkles, Square, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";

const SUGGESTIONS = [
    "最新の動画について教えて",
    "Reactについて学べる動画はある？",
    "AIの活用方法を知りたい",
    "初心者向けのおすすめ動画は？",
];

interface VideoInfo {
    videoId: string;
    title: string;
    muxPlaybackId?: string | null;
}

function VideoCard({
    videoId,
    muxPlaybackId,
    title,
}: {
    videoId: string;
    muxPlaybackId?: string | null;
    title: string;
}) {
    const thumbnailUrl = muxPlaybackId
        ? `https://image.mux.com/${muxPlaybackId}/thumbnail.jpg?width=480&height=270&fit_mode=smartcrop`
        : null;

    return (
        <Link href={`/videos/${videoId}`} className="block no-underline group">
            <div className="rounded-xl border-2 border-black bg-cream overflow-hidden brutal-shadow-sm hover:translate-y-[-2px] transition-all duration-200">
                {thumbnailUrl ? (
                    <div className="relative aspect-video bg-gray-200">
                        <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="aspect-video bg-gradient-to-br from-pop-purple/20 to-pop-yellow/20 flex items-center justify-center">
                        <Play className="w-10 h-10 text-gray-400" />
                    </div>
                )}
                <div className="px-3 py-2 border-t-2 border-black flex items-center justify-between gap-2">
                    <p className="font-black text-sm text-black truncate">{title}</p>
                    <ExternalLink className="w-4 h-4 text-gray-400 shrink-0" />
                </div>
            </div>
        </Link>
    );
}

// biome-ignore lint/suspicious/noExplicitAny: AI SDK v6 の parts 型は複雑なため any を使用
function extractVideosFromParts(parts: Array<any>): VideoInfo[] {
    const videos: VideoInfo[] = [];
    const seen = new Set<string>();

    for (const part of parts) {
        // AI SDK v6: ツールパーツは type="tool-{toolName}", state="output-available", 結果は output
        if (!part.type?.startsWith("tool-") || part.state !== "output-available") continue;
        const toolName = part.type.slice(5);
        const result = part.output;
        if (!result) continue;

        if (toolName === "listVideos" && Array.isArray(result.videos)) {
            for (const v of result.videos) {
                if (v.videoId && !seen.has(v.videoId)) {
                    seen.add(v.videoId);
                    videos.push({
                        videoId: v.videoId,
                        title: v.title || "動画",
                        muxPlaybackId: v.muxPlaybackId,
                    });
                }
            }
        }

        if (toolName === "searchVideos" && Array.isArray(result.results)) {
            for (const r of result.results) {
                if (r.videoId && !seen.has(r.videoId)) {
                    seen.add(r.videoId);
                    videos.push({
                        videoId: r.videoId,
                        title: r.videoTitle || "動画",
                        muxPlaybackId: r.muxPlaybackId,
                    });
                }
            }
        }
    }

    return videos;
}

function getMessageText(parts: Array<{ type: string; text?: string }>): string {
    return parts
        .filter((part): part is { type: "text"; text: string } => part.type === "text" && !!part.text)
        .map((part) => part.text)
        .join("");
}

type ContentBlock = { type: "text"; content: string } | { type: "video"; video: VideoInfo };

function buildInterleavedContent(text: string, videos: VideoInfo[]): ContentBlock[] {
    if (!text) return [];
    if (videos.length === 0) return [{ type: "text", content: text }];

    // 番号付きセクション（1. 2. 3. ...）で分割
    const sections = text.split(/(?=(?:^|\n)\d+\.\s)/m);
    const blocks: ContentBlock[] = [];
    let videoIdx = 0;

    for (const section of sections) {
        blocks.push({ type: "text", content: section });

        // 番号付きセクションにはツール結果の動画を順番に紐付ける
        if (/(?:^|\n)\d+\.\s/.test(section) && videoIdx < videos.length) {
            blocks.push({ type: "video", video: videos[videoIdx] });
            videoIdx++;
        }
    }

    return blocks;
}

export function AiChatInterface() {
    const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);

    const { messages, sendMessage, stop, status, error } = useChat({ transport });

    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const isLoading = status === "streaming" || status === "submitted";

    useEffect(() => {
        if (error) {
            console.error("[AiChatInterface] チャットエラー:", error);
        }
    }, [error]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSend = () => {
        const text = input.trim();
        if (!text || isLoading) return;
        setInput("");
        sendMessage({ text });
    };

    const handleSuggestionClick = (suggestion: string) => {
        setInput("");
        sendMessage({ text: suggestion });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)]">
            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-6">
                        <div className="w-20 h-20 rounded-2xl bg-pop-purple border-3 border-black brutal-shadow flex items-center justify-center">
                            <Sparkles className="w-10 h-10 text-white" />
                        </div>
                        <div className="text-center max-w-md">
                            <h2 className="text-2xl font-black text-black mb-2">学習アシスタント</h2>
                            <p className="text-gray-600 font-bold text-sm">
                                動画コンテンツの内容について質問してみましょう。
                                AIが最適な動画とタイムスタンプを提案します。
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                            {SUGGESTIONS.map((suggestion) => (
                                <button
                                    key={suggestion}
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    className="text-left px-4 py-3 rounded-xl border-2 border-black bg-white hover:bg-pop-yellow/30 hover:translate-y-[-2px] transition-all duration-200 brutal-shadow-sm font-bold text-sm text-black"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    messages.map((message) => {
                        const parts = message.parts || [];
                        const text = getMessageText(parts);
                        const videos = message.role === "assistant" ? extractVideosFromParts(parts) : [];
                        if (!text && videos.length === 0) return null;

                        return (
                            <div
                                key={message.id}
                                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                {message.role === "assistant" && (
                                    <div className="w-8 h-8 rounded-lg bg-pop-purple border-2 border-black brutal-shadow-sm flex items-center justify-center shrink-0 mt-1">
                                        <Bot className="w-4 h-4 text-white" />
                                    </div>
                                )}
                                <div
                                    className={`max-w-[80%] md:max-w-[70%] rounded-xl px-4 py-3 border-2 border-black ${
                                        message.role === "user"
                                            ? "bg-pop-yellow brutal-shadow-sm"
                                            : "bg-white brutal-shadow-sm"
                                    }`}
                                >
                                    {buildInterleavedContent(text, videos).map((block, i) =>
                                        block.type === "text" ? (
                                            <div
                                                key={`t-${i}`}
                                                className="prose prose-sm max-w-none text-black prose-headings:font-black prose-headings:text-black prose-headings:mt-3 prose-headings:mb-1.5 prose-h1:text-lg prose-h2:text-base prose-h3:text-sm prose-p:my-2 prose-p:leading-relaxed prose-strong:font-black prose-strong:text-black prose-a:text-pop-purple prose-a:font-bold prose-a:underline prose-a:underline-offset-2 hover:prose-a:text-pop-purple/70 prose-ul:my-2 prose-ul:pl-4 prose-ol:my-2 prose-ol:pl-4 prose-li:my-1 prose-li:leading-relaxed prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-xs prose-code:font-mono prose-code:border prose-code:border-gray-300 prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-lg prose-pre:border-2 prose-pre:border-black prose-pre:my-3 prose-blockquote:border-l-4 prose-blockquote:border-pop-purple prose-blockquote:bg-pop-purple/5 prose-blockquote:py-1 prose-blockquote:px-3 prose-blockquote:my-2 prose-blockquote:rounded-r-lg prose-hr:my-3 prose-hr:border-gray-300 prose-img:hidden"
                                            >
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {block.content}
                                                </ReactMarkdown>
                                            </div>
                                        ) : (
                                            <div key={`v-${block.video.videoId}`} className="my-3">
                                                <VideoCard
                                                    videoId={block.video.videoId}
                                                    muxPlaybackId={block.video.muxPlaybackId}
                                                    title={block.video.title}
                                                />
                                            </div>
                                        ),
                                    )}
                                </div>
                                {message.role === "user" && (
                                    <div className="w-8 h-8 rounded-lg bg-pop-green border-2 border-black brutal-shadow-sm flex items-center justify-center shrink-0 mt-1">
                                        <User className="w-4 h-4 text-black" />
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
                {error && (
                    <div className="flex gap-3 justify-start">
                        <div className="max-w-[80%] md:max-w-[70%] rounded-xl px-4 py-3 border-2 border-red-500 bg-red-50">
                            <p className="font-bold text-red-600 text-sm">エラーが発生しました: {error.message}</p>
                        </div>
                    </div>
                )}
                {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                    <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 rounded-lg bg-pop-purple border-2 border-black brutal-shadow-sm flex items-center justify-center shrink-0">
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="rounded-xl px-4 py-3 border-2 border-black bg-white brutal-shadow-sm">
                            <div className="flex items-center gap-2">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-black rounded-full animate-bounce [animation-delay:0ms]" />
                                    <span className="w-2 h-2 bg-black rounded-full animate-bounce [animation-delay:150ms]" />
                                    <span className="w-2 h-2 bg-black rounded-full animate-bounce [animation-delay:300ms]" />
                                </div>
                                <span className="text-sm font-bold text-gray-500">検索中...</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="border-t-3 border-black bg-white p-4">
                <div className="flex gap-3 max-w-3xl mx-auto">
                    <div className="flex-1 relative">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="質問を入力してください..."
                            rows={1}
                            className="w-full resize-none rounded-xl border-2 border-black px-4 py-3 pr-12 font-bold text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pop-purple focus:border-pop-purple bg-cream brutal-shadow-sm text-sm"
                        />
                    </div>
                    {isLoading ? (
                        <Button
                            type="button"
                            onClick={() => stop()}
                            className="rounded-xl border-2 border-black bg-pop-red hover:bg-pop-red/80 text-white font-black px-4 brutal-shadow-sm h-auto"
                        >
                            <Square className="w-4 h-4" />
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            onClick={handleSend}
                            disabled={!input.trim()}
                            className="rounded-xl border-2 border-black bg-pop-purple hover:bg-pop-purple/80 text-white font-black px-4 brutal-shadow-sm h-auto disabled:opacity-50"
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
