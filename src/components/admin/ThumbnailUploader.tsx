import React from "react";
import { Id } from "../../../convex/_generated/dataModel";

interface ThumbnailUploaderProps {
    customThumbnailUrl: string | null;
    onUpload: (file: File) => Promise<void>;
}

export function ThumbnailUploader({ customThumbnailUrl, onUpload }: ThumbnailUploaderProps) {
    return (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
            <h3 className="font-bold mb-2 text-sm">カスタムサムネイル</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Muxのデフォルトサムネイルの代わりに表示する画像をアップロードできます。
            </p>

            {customThumbnailUrl && (
                <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">現在のサムネイル:</p>
                    <img src={customThumbnailUrl} alt="Thumbnail" className="w-64 h-auto rounded border" />
                </div>
            )}

            <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    await onUpload(file);
                }}
                className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
            />
        </div>
    );
}
