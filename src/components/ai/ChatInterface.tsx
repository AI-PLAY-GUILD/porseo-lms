import { useState, useRef, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import ReactMarkdown from "react-markdown";

interface ChatInterfaceProps {
    videoId: Id<"videos">;
    onTimestampClick: (time: number) => void;
}

interface Message {
    role: "user" | "model";
    content: string;
}

export default function ChatInterface({ videoId, onTimestampClick }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false); // 開閉状態
    const chatAction = useAction(api.rag.chat);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: "user", content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await chatAction({
                videoId,
                messages: [...messages, userMessage],
            });

            const aiMessage: Message = { role: "model", content: response ?? "" };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error("Chat error:", error);
            alert("エラーが発生しました。もう一度お試しください。");
        } finally {
            setIsLoading(false);
        }
    };

    // タイムスタンプ [MM:SS] をクリック可能なリンクに変換するレンダラー
    const renderContent = (content: string) => {
        // 正規表現で [00:00] 形式を探す
        const parts = content.split(/(\[\d{2}:\d{2}\])/g);
        return parts.map((part, index) => {
            const match = part.match(/^\[(\d{2}):(\d{2})\]$/);
            if (match) {
                const minutes = parseInt(match[1]);
                const seconds = parseInt(match[2]);
                const timeInSeconds = minutes * 60 + seconds;
                return (
                    <button
                        key={index}
                        onClick={() => onTimestampClick(timeInSeconds)}
                        className="text-blue-600 hover:underline font-bold mx-1"
                    >
                        {part}
                    </button>
                );
            }
            return <span key={index}>{part}</span>;
        });
    };

    // 閉じている時の表示（円形ボタン）
    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 z-50"
                aria-label="AIチャットを開く"
            >
                <span className="text-3xl">🤖</span>
            </button>
        );
    }

    // 開いている時の表示
    return (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] max-h-[80vh] bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 shadow-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-200">
            {/* ヘッダー */}
            <div className="p-4 border-b dark:border-gray-700 bg-blue-600 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">🤖</span>
                    <div>
                        <h3 className="font-bold text-sm">AIアシスタント</h3>
                        <p className="text-xs text-blue-100">動画の内容について質問できます</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-blue-700 rounded transition-colors"
                >
                    <span className="text-xl">✕</span>
                </button>
            </div>

            {/* メッセージエリア */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 py-8 text-sm">
                        <p>「この動画の要点は？」</p>
                        <p>「ReactのHooksについて何と言ってる？」</p>
                        <br />
                        など、自由に質問してみてください。
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`max-w-[85%] p-3 rounded-lg text-sm shadow-sm ${msg.role === "user"
                                ? "bg-blue-600 text-white rounded-br-none"
                                : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none border dark:border-gray-700"
                                }`}
                        >
                            {msg.role === "user" ? (
                                msg.content
                            ) : (
                                <div className="prose dark:prose-invert max-w-none text-sm">
                                    {renderContent(msg.content)}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg rounded-bl-none border dark:border-gray-700 shadow-sm">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* 入力エリア */}
            <form onSubmit={handleSubmit} className="p-3 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="質問を入力..."
                        className="flex-1 p-2 border rounded-lg bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold text-sm"
                    >
                        送信
                    </button>
                </div>
            </form>
        </div>
    );
}
