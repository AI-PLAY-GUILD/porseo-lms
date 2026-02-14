import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getTags = query({
    handler: async (ctx) => {
        return await ctx.db.query("tags").order("desc").collect();
    },
});

export const createTag = mutation({
    args: {
        name: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user?.isAdmin) throw new Error("Admin access required");

        // Simple slug generation: lowercase and replace spaces with hyphens
        // For Japanese characters, this might result in empty or same strings if not handled,
        // but for now we'll just use the name as is if it's not ascii, or maybe just use a random ID if collision?
        // Actually, let's just use the name as the slug if it's unique enough, or just generate a random one.
        // Given the user doesn't care about slugs, let's just make it a random string or based on name.
        // Let's try to make it readable if possible, but fallback to random.

        // Better approach for now: just use the name as the slug, but check for uniqueness.
        // If the user doesn't care, maybe we don't even need a unique slug? 
        // But the schema requires it and indexes it.
        // Let's generate a slug from the name, and append a random string if it exists.

        const slug = args.name.toLowerCase().replace(/\s+/g, "-");

        const existing = await ctx.db
            .query("tags")
            .withIndex("by_slug", (q) => q.eq("slug", slug))
            .first();

        if (existing) throw new Error("Tag with this name already exists");

        const tagId = await ctx.db.insert("tags", {
            name: args.name,
            slug: slug,
            createdAt: Date.now(),
        });

        await ctx.db.insert("auditLogs", {
            userId: user._id,
            action: "tag.create",
            targetType: "tag",
            targetId: tagId,
            details: args.name,
            createdAt: Date.now(),
        });
    },
});

export const deleteTag = mutation({
    args: { tagId: v.id("tags") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user?.isAdmin) throw new Error("Admin access required");

        const tag = await ctx.db.get(args.tagId);
        await ctx.db.delete(args.tagId);

        await ctx.db.insert("auditLogs", {
            userId: user._id,
            action: "tag.delete",
            targetType: "tag",
            targetId: args.tagId,
            details: tag?.name,
            createdAt: Date.now(),
        });
    },
});
