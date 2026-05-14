import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type DbCtx = Pick<QueryCtx | MutationCtx, "db">;

const ACTIVE_APP_STATUSES = new Set(["active", "trialing", "past_due", "note_trial"]);
const ROLE_GRANTING_APP_STATUSES = new Set(["active", "trialing", "note_trial"]);
const ACTIVE_NOTE_STATUSES = new Set(["active", "confirmed"]);

export function isActiveAppStatus(status?: string | null) {
    return ACTIVE_APP_STATUSES.has(status ?? "");
}

export function isRoleGrantingAppStatus(status?: string | null) {
    return ROLE_GRANTING_APP_STATUSES.has(status ?? "");
}

export function isActiveNoteStatus(status?: string | null) {
    return ACTIVE_NOTE_STATUSES.has(status ?? "");
}

export async function getActiveNoteMembership(ctx: DbCtx, userId: Doc<"users">["_id"]) {
    const claims = await ctx.db
        .query("noteMembershipClaims")
        .withIndex("by_user_id", (q) => q.eq("userId", userId))
        .collect();

    return claims.find((claim) => isActiveNoteStatus(claim.status)) ?? null;
}

export async function hasActiveNoteMembership(ctx: DbCtx, userId: Doc<"users">["_id"]) {
    return !!(await getActiveNoteMembership(ctx, userId));
}

export async function hasActiveMembershipAccess(ctx: DbCtx, user: Doc<"users">) {
    if (user.isAdmin) return true;
    if (isActiveAppStatus(user.subscriptionStatus)) return true;
    return hasActiveNoteMembership(ctx, user._id);
}

export async function getEffectiveSubscriptionStatus(ctx: DbCtx, user: Doc<"users">) {
    if (isActiveAppStatus(user.subscriptionStatus)) {
        return user.subscriptionStatus;
    }

    if (await hasActiveNoteMembership(ctx, user._id)) {
        return "active";
    }

    return user.subscriptionStatus;
}

export async function getMembershipSummary(ctx: DbCtx, user: Doc<"users">) {
    const noteMembership = await getActiveNoteMembership(ctx, user._id);
    const effectiveSubscriptionStatus = isActiveAppStatus(user.subscriptionStatus)
        ? user.subscriptionStatus
        : noteMembership
          ? "active"
          : user.subscriptionStatus;

    return {
        subscriptionStatus: effectiveSubscriptionStatus,
        rawSubscriptionStatus: user.subscriptionStatus,
        hasActiveNoteMembership: !!noteMembership,
        noteMembershipStatus: noteMembership?.status,
        noteMembershipPlanName: noteMembership?.planName,
        noteMembershipNoteId: noteMembership?.noteId,
    };
}

export async function getEffectiveDiscordRoles(ctx: DbCtx, user: Doc<"users">) {
    const roles = new Set(user.discordRoles ?? []);
    const defaultRoleId = process.env.DISCORD_ROLE_ID;

    if (
        defaultRoleId &&
        (user.isAdmin || isRoleGrantingAppStatus(user.subscriptionStatus) || (await hasActiveNoteMembership(ctx, user._id)))
    ) {
        roles.add(defaultRoleId);
    }

    return Array.from(roles);
}

export function hasRequiredRoleAccess(requiredRoles: string[] | undefined, effectiveRoles: string[]) {
    return !requiredRoles || requiredRoles.length === 0 || requiredRoles.some((role) => effectiveRoles.includes(role));
}
