import React from "react";

interface MuxSettingsProps {
    muxAssetId: string;
    muxPlaybackId: string;
    onAssetIdChange: (value: string) => void;
    onPlaybackIdChange: (value: string) => void;
}

export function MuxSettings({ muxAssetId, muxPlaybackId, onAssetIdChange, onPlaybackIdChange }: MuxSettingsProps) {
    return (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
            <h3 className="font-bold text-yellow-600 dark:text-yellow-500 mb-2 text-sm">Mux設定（上級者向け）</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                動画が再生できない場合やAI分析が失敗する場合は、ここのIDが間違っている可能性があります。<br />
                Muxダッシュボードで &quot;Asset ID&quot; と &quot;Playback ID&quot; を確認してください。
            </p>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Mux Asset ID</label>
                <input
                    type="text"
                    value={muxAssetId}
                    onChange={(e) => onAssetIdChange(e.target.value)}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-900 font-mono text-sm"
                    placeholder="Mux Asset ID"
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Mux Playback ID</label>
                <input
                    type="text"
                    value={muxPlaybackId}
                    onChange={(e) => onPlaybackIdChange(e.target.value)}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-900 font-mono text-sm"
                    placeholder="Mux Playback ID"
                />
            </div>
        </div>
    );
}
