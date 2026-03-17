"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";

const FORUM_CHANNEL_ID = "1483350303104307241";
const VIDEO_BASE_URL = "https://aiplayguild.com/videos";

export const postVideoToForum = internalAction({
    args: {
        videoId: v.string(),
        title: v.string(),
        description: v.optional(v.string()),
        summary: v.optional(v.string()),
    },
    handler: async (_ctx, args) => {
        console.log("[discordNotify:postVideoToForum] 開始", { videoId: args.videoId, title: args.title });

        const botToken = process.env.DISCORD_BOT_TOKEN;
        if (!botToken) {
            console.error("[discordNotify:postVideoToForum] DISCORD_BOT_TOKEN未設定");
            return;
        }

        const videoUrl = `${VIDEO_BASE_URL}/${args.videoId}`;

        // Build message content
        let content = "";
        if (args.summary) {
            content += args.summary;
        } else if (args.description) {
            content += args.description;
        }

        // Truncate if too long (Discord limit: 2000 chars for message)
        if (content.length > 1500) {
            content = `${content.substring(0, 1500)}...`;
        }

        content += `\n\n**動画を視聴する**\n${videoUrl}`;

        try {
            // Create a forum thread (POST /channels/{channel_id}/threads)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            try {
                const response = await fetch(`https://discord.com/api/v10/channels/${FORUM_CHANNEL_ID}/threads`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bot ${botToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name: args.title.substring(0, 100), // Forum thread title (max 100 chars)
                        message: {
                            content,
                        },
                    }),
                    signal: controller.signal,
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log("[discordNotify:postVideoToForum] フォーラム投稿成功", { threadId: data.id });
                } else {
                    const errorText = await response.text();
                    console.error("[discordNotify:postVideoToForum] Discord APIエラー:", response.status, errorText);
                }
            } finally {
                clearTimeout(timeoutId);
            }
        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") {
                console.error("[discordNotify:postVideoToForum] Discord APIタイムアウト");
            } else {
                console.error("[discordNotify:postVideoToForum] エラー:", error);
            }
        }
    },
});
