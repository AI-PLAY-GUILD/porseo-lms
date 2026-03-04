import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

// Internal: 認証不要のアップロードURL生成（スクリプト用）
export const generateInternalUploadUrl = internalMutation({
    handler: async (ctx) => {
        return await ctx.storage.generateUploadUrl();
    },
});

// Internal: サムネイルStorageIDを動画に設定
export const setThumbnail = internalMutation({
    args: {
        videoId: v.id("videos"),
        storageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.videoId, {
            customThumbnailStorageId: args.storageId,
            updatedAt: Date.now(),
        });
    },
});

// Internal: サムネイルなし動画のID・タイトル・文字起こしを取得
export const listVideosForThumbnailsWithTranscription = internalQuery({
    handler: async (ctx) => {
        const videos = await ctx.db.query("videos").collect();
        return videos
            .filter((v) => !v.customThumbnailStorageId)
            .map((v) => ({
                _id: v._id,
                title: v.title,
                transcription: v.transcription,
            }));
    },
});

// Internal: 全動画のID・タイトル・サムネ有無を取得（公開/非公開問わず）
export const listAllVideos = internalQuery({
    handler: async (ctx) => {
        const videos = await ctx.db.query("videos").collect();
        return videos.map((v) => ({
            _id: v._id,
            title: v.title,
            isPublished: v.isPublished,
            hasThumbnail: !!v.customThumbnailStorageId,
            createdAt: v.createdAt,
        }));
    },
});
