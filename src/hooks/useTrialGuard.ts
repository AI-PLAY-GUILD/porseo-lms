"use client";

import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "../../convex/_generated/api";

// biome-ignore lint/suspicious/noExplicitAny: Convex codegen not available without `npx convex dev`
const getTrialStatusRef = (api as any).notePromo?.getTrialStatus ?? "skip";

export function useTrialGuard() {
    const router = useRouter();
    const trialStatus = useQuery(getTrialStatusRef === "skip" ? "skip" : getTrialStatusRef);
    const user = useQuery(api.users.getUser);

    useEffect(() => {
        if (user === undefined || trialStatus === undefined) return;

        // Only guard note_trial users
        if (user?.subscriptionStatus !== "note_trial") return;

        // If trial exists and is expired, redirect
        if (trialStatus && trialStatus.status === "expired") {
            router.push("/trial-expired");
        }
    }, [user, trialStatus, router]);

    return { trialStatus, isTrialUser: user?.subscriptionStatus === "note_trial" };
}
