import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { isActiveNoteStatus, isRoleGrantingAppStatus } from "./lib/membership";
import { validateInternalSecret } from "./lib/requireSecret";
import { getUserByClerkId } from "./users";

const MAX_NOTE_ID_LENGTH = 80;
const MAX_MEMBER_NUMBER_LENGTH = 80;
const MAX_PLAN_NAME_LENGTH = 120;
const MAX_EXTERNAL_ACCOUNT_LENGTH = 160;
const MAX_REVIEW_NOTE_LENGTH = 500;

type ClaimStatus = "active" | "confirmed" | "review" | "rejected";
type RoleUpdate = {
    discordId: string;
    action: "add" | "remove";
};

function normalizeRequired(value: string, label: string, maxLength: number) {
    const normalized = value.trim().replace(/^@/, "");
    if (!normalized) throw new Error(`${label} is required`);
    if (normalized.length > maxLength) throw new Error(`${label} must be ${maxLength} characters or less`);
    return normalized;
}

function normalizeOptional(value: string | undefined, maxLength: number) {
    const normalized = value?.trim();
    if (!normalized) return undefined;
    if (normalized.length > maxLength) throw new Error(`Value must be ${maxLength} characters or less`);
    return normalized;
}

async function writeAuditLog(
    ctx: MutationCtx,
    userId: Id<"users"> | undefined,
    action: string,
    targetId?: string,
    details?: string,
) {
    await ctx.db.insert("auditLogs", {
        userId,
        action,
        targetType: "noteMembershipClaims",
        targetId,
        details,
        createdAt: Date.now(),
    });
}

async function checkAdmin(ctx: QueryCtx | MutationCtx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await getUserByClerkId(ctx, identity.subject);
    if (!user || !user.isAdmin) throw new Error("Unauthorized: Admin access required");
    return user;
}

async function checkAdminByClerkId(ctx: QueryCtx | MutationCtx, clerkId: string) {
    const user = await getUserByClerkId(ctx, clerkId);
    if (!user || !user.isAdmin) throw new Error("Unauthorized: Admin access required");
    return user;
}

async function hasOtherActiveNoteClaim(ctx: QueryCtx | MutationCtx, userId: Id<"users">, excludeClaimId?: Id<"noteMembershipClaims">) {
    const claims = await ctx.db
        .query("noteMembershipClaims")
        .withIndex("by_user_id", (q) => q.eq("userId", userId))
        .collect();

    return claims.some((claim) => claim._id !== excludeClaimId && isActiveNoteStatus(claim.status));
}

async function roleUpdateForStatus(
    ctx: QueryCtx | MutationCtx,
    userId: Id<"users">,
    status: ClaimStatus,
    claimId: Id<"noteMembershipClaims">,
): Promise<RoleUpdate | null> {
    const user = await ctx.db.get(userId);
    if (!user?.discordId || !process.env.DISCORD_ROLE_ID) return null;

    if (isActiveNoteStatus(status)) {
        return { discordId: user.discordId, action: "add" };
    }

    if (status === "rejected") {
        const shouldKeepRole =
            isRoleGrantingAppStatus(user.subscriptionStatus) || (await hasOtherActiveNoteClaim(ctx, userId, claimId));
        if (!shouldKeepRole) {
            return { discordId: user.discordId, action: "remove" };
        }
    }

    return null;
}

export const getMyClaim = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const user = await getUserByClerkId(ctx, identity.subject);
        if (!user) return null;

        return await ctx.db
            .query("noteMembershipClaims")
            .withIndex("by_user_id", (q) => q.eq("userId", user._id))
            .order("desc")
            .first();
    },
});

export const claimByClerkId = mutation({
    args: {
        clerkId: v.string(),
        noteId: v.string(),
        memberNumber: v.optional(v.string()),
        planName: v.optional(v.string()),
        externalAccount: v.optional(v.string()),
        secret: v.string(),
    },
    handler: async (ctx, args) => {
        validateInternalSecret(args.secret);

        const noteId = normalizeRequired(args.noteId, "note ID", MAX_NOTE_ID_LENGTH);
        const memberNumber = normalizeOptional(args.memberNumber, MAX_MEMBER_NUMBER_LENGTH);
        const planName = normalizeOptional(args.planName, MAX_PLAN_NAME_LENGTH);
        const externalAccount = normalizeOptional(args.externalAccount, MAX_EXTERNAL_ACCOUNT_LENGTH);

        const user = await getUserByClerkId(ctx, args.clerkId);
        if (!user) throw new Error("User not found");

        const now = Date.now();
        const existingForNoteId = await ctx.db
            .query("noteMembershipClaims")
            .withIndex("by_note_id", (q) => q.eq("noteId", noteId))
            .collect();
        const conflictingClaim = existingForNoteId.find(
            (claim) => claim.userId !== user._id && claim.status !== "rejected",
        );
        const ownClaim =
            existingForNoteId.find((claim) => claim.userId === user._id) ??
            (await ctx.db
                .query("noteMembershipClaims")
                .withIndex("by_user_id", (q) => q.eq("userId", user._id))
                .first());

        const nextStatus: ClaimStatus = conflictingClaim ? "review" : "active";

        if (ownClaim) {
            if (ownClaim.status === "rejected") {
                throw new Error("This note membership claim is rejected. Please contact support.");
            }

            await ctx.db.patch(ownClaim._id, {
                noteId,
                memberNumber,
                planName,
                externalAccount,
                status: nextStatus,
                updatedAt: now,
                reviewNote: conflictingClaim ? "Duplicate note ID requires admin review" : undefined,
            });
            await writeAuditLog(ctx, user._id, "note_membership.claim_update", ownClaim._id, `status=${nextStatus}`);
            return {
                claimId: ownClaim._id,
                status: nextStatus,
                requiresReview: nextStatus === "review",
            };
        }

        const claimId = await ctx.db.insert("noteMembershipClaims", {
            userId: user._id,
            noteId,
            memberNumber,
            planName,
            externalAccount,
            status: nextStatus,
            claimedAt: now,
            updatedAt: now,
            reviewNote: conflictingClaim ? "Duplicate note ID requires admin review" : undefined,
        });

        await writeAuditLog(ctx, user._id, "note_membership.claim_create", claimId, `status=${nextStatus}`);
        return {
            claimId,
            status: nextStatus,
            requiresReview: nextStatus === "review",
        };
    },
});

export const listClaims = query({
    args: {},
    handler: async (ctx) => {
        await checkAdmin(ctx);

        const claims = await ctx.db.query("noteMembershipClaims").order("desc").collect();
        return await Promise.all(
            claims.map(async (claim) => {
                const user = await ctx.db.get(claim.userId);
                return {
                    ...claim,
                    userName: user?.name ?? "Unknown",
                    userEmail: user?.email ?? "",
                    userDiscordId: user?.discordId,
                };
            }),
        );
    },
});

export const getStats = query({
    args: {},
    handler: async (ctx) => {
        await checkAdmin(ctx);
        const claims = await ctx.db.query("noteMembershipClaims").collect();

        return {
            total: claims.length,
            active: claims.filter((claim) => claim.status === "active").length,
            confirmed: claims.filter((claim) => claim.status === "confirmed").length,
            review: claims.filter((claim) => claim.status === "review").length,
            rejected: claims.filter((claim) => claim.status === "rejected").length,
        };
    },
});

export const reviewClaimByIdServer = mutation({
    args: {
        adminClerkId: v.string(),
        claimId: v.id("noteMembershipClaims"),
        status: v.string(),
        reviewNote: v.optional(v.string()),
        secret: v.string(),
    },
    handler: async (ctx, args) => {
        validateInternalSecret(args.secret);
        const admin = await checkAdminByClerkId(ctx, args.adminClerkId);
        if (!["active", "confirmed", "review", "rejected"].includes(args.status)) {
            throw new Error("Invalid note membership status");
        }

        const status = args.status as ClaimStatus;
        const claim = await ctx.db.get(args.claimId);
        if (!claim) throw new Error("Claim not found");

        const now = Date.now();
        const reviewNote = normalizeOptional(args.reviewNote, MAX_REVIEW_NOTE_LENGTH);
        await ctx.db.patch(args.claimId, {
            status,
            reviewNote,
            updatedAt: now,
            ...(status === "confirmed" ? { lastVerifiedAt: now, verifiedBy: admin._id } : {}),
            ...(status === "rejected" ? { rejectedAt: now, rejectedBy: admin._id } : {}),
        });

        await writeAuditLog(ctx, admin._id, "note_membership.review", args.claimId, `status=${status}`);

        return {
            roleUpdate: await roleUpdateForStatus(ctx, claim.userId, status, args.claimId),
        };
    },
});

export const importCsvRowsServer = mutation({
    args: {
        adminClerkId: v.string(),
        rows: v.array(
            v.object({
                noteId: v.string(),
                memberNumber: v.optional(v.string()),
                planName: v.optional(v.string()),
                externalAccount: v.optional(v.string()),
            }),
        ),
        revokeMissing: v.boolean(),
        secret: v.string(),
    },
    handler: async (ctx, args) => {
        validateInternalSecret(args.secret);
        const admin = await checkAdminByClerkId(ctx, args.adminClerkId);
        const now = Date.now();
        const roleUpdates: RoleUpdate[] = [];
        const unmatchedRows: Array<{ noteId: string; memberNumber?: string; planName?: string }> = [];
        const seenNoteIds = new Set<string>();

        const importId = await ctx.db.insert("noteMembershipImports", {
            importedBy: admin._id,
            rowCount: args.rows.length,
            matchedCount: 0,
            unmatchedCount: 0,
            rejectedCount: 0,
            createdAt: now,
        });

        let matchedCount = 0;
        let rejectedCount = 0;

        for (const row of args.rows) {
            const noteId = normalizeRequired(row.noteId, "note ID", MAX_NOTE_ID_LENGTH);
            if (seenNoteIds.has(noteId)) continue;
            seenNoteIds.add(noteId);

            const memberNumber = normalizeOptional(row.memberNumber, MAX_MEMBER_NUMBER_LENGTH);
            const planName = normalizeOptional(row.planName, MAX_PLAN_NAME_LENGTH);
            const externalAccount = normalizeOptional(row.externalAccount, MAX_EXTERNAL_ACCOUNT_LENGTH);
            const claim = await ctx.db
                .query("noteMembershipClaims")
                .withIndex("by_note_id", (q) => q.eq("noteId", noteId))
                .first();

            if (!claim) {
                unmatchedRows.push({ noteId, memberNumber, planName });
                continue;
            }

            await ctx.db.patch(claim._id, {
                memberNumber: memberNumber ?? claim.memberNumber,
                planName: planName ?? claim.planName,
                externalAccount: externalAccount ?? claim.externalAccount,
                status: "confirmed",
                lastVerifiedAt: now,
                verifiedBy: admin._id,
                lastCsvImportId: importId,
                updatedAt: now,
                reviewNote: undefined,
            });
            matchedCount++;

            const roleUpdate = await roleUpdateForStatus(ctx, claim.userId, "confirmed", claim._id);
            if (roleUpdate) roleUpdates.push(roleUpdate);
        }

        if (args.revokeMissing) {
            const activeClaims = await ctx.db.query("noteMembershipClaims").collect();
            for (const claim of activeClaims) {
                if (!isActiveNoteStatus(claim.status) || seenNoteIds.has(claim.noteId)) continue;

                await ctx.db.patch(claim._id, {
                    status: "rejected",
                    rejectedAt: now,
                    rejectedBy: admin._id,
                    reviewNote: "Latest note CSV did not contain this note ID",
                    updatedAt: now,
                    lastCsvImportId: importId,
                });
                rejectedCount++;

                const roleUpdate = await roleUpdateForStatus(ctx, claim.userId, "rejected", claim._id);
                if (roleUpdate) roleUpdates.push(roleUpdate);
            }
        }

        await ctx.db.patch(importId, {
            matchedCount,
            unmatchedCount: unmatchedRows.length,
            rejectedCount,
        });

        await writeAuditLog(
            ctx,
            admin._id,
            "note_membership.csv_import",
            importId,
            `rows=${args.rows.length}, matched=${matchedCount}, unmatched=${unmatchedRows.length}, rejected=${rejectedCount}`,
        );

        return {
            importId,
            rowCount: args.rows.length,
            matchedCount,
            unmatchedCount: unmatchedRows.length,
            rejectedCount,
            unmatchedRows: unmatchedRows.slice(0, 50),
            roleUpdates,
        };
    },
});
