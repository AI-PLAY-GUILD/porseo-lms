import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const MAX_TAG_NAME_LENGTH = 50;

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

        // Input validation
        if (args.name.trim().length === 0) throw new Error("Tag name cannot be empty");
        if (args.name.length > MAX_TAG_NAME_LENGTH) throw new Error(`Tag name must be ${MAX_TAG_NAME_LENGTH} characters or less`);

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user?.isAdmin) throw new Error("Admin access required");

        // Unicode-safe slug generation:
        // Normalize, lowercase, replace whitespace with hyphens, keep CJK + alphanumeric
        const baseSlug = args.name
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3400-\u4DBF-]/g, "")
            .replace(/^-+|-+$/g, "")
            || `tag-${Date.now()}`;

        let slug = baseSlug;
        const existing = await ctx.db
            .query("tags")
            .withIndex("by_slug", (q) => q.eq("slug", slug))
            .first();

        // Append timestamp suffix on collision instead of rejecting
        if (existing) {
            slug = `${baseSlug}-${Date.now().toString(36)}`;
        }

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
