"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Bot, Send, Sparkles, Square, User } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";

const SUGGESTIONS = [
    "最新の動画について教えて",
    "Reactについて学べる動画はある？",
    "AIの活用方法を知りたい",
    "初心者向けのおすすめ動画は？",
];

function getMessageText(message: { parts?: Array<{ type: string; text?: string }> }): string {
    if (!message.parts) return "";
    return message.parts
        .filter((part): part is { type: "text"; text: string } => part.type === "text" && !!part.text)
        .map((part) => part.text)
        .join("");
}

export function AiChatInterface() {
    const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);

    const { messages, sendMessage, stop, status } = useChat({ transport });

    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const isLoading = status === "streaming" || status === "submitted";

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, []);

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
                        const text = getMessageText(message);
                        if (!text) return null;
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
                                    <div className="prose prose-sm max-w-none font-bold text-black prose-headings:font-black prose-strong:text-black prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                                        <ReactMarkdown>{text}</ReactMarkdown>
                                    </div>
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
