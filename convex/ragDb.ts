import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

export const saveChunks = internalMutation({
    args: {
        chunks: v.array(
            v.object({
                videoId: v.id("videos"),
                text: v.string(),
                startTime: v.number(),
                endTime: v.number(),
                embedding: v.array(v.number()),
            })
        ),
    },
    handler: async (ctx, args) => {
        for (const chunk of args.chunks) {
            await ctx.db.insert("transcription_chunks", chunk);
        }
    },
});

// Security: Added auth check to prevent unauthenticated access to transcript data (Issue #18)
export const getChunk = query({
    args: { id: v.id("transcription_chunks") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        return await ctx.db.get(args.id);
    },
});
