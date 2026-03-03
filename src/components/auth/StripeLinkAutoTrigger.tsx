"use client";

import { useAction, useConvexAuth } from "convex/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { clearPendingStripeLink, getPendingStripeLink } from "@/lib/stripe-link";
import { api } from "../../../convex/_generated/api";

export default function StripeLinkAutoTrigger() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated } = useConvexAuth();
    const linkStripeCustomer = useAction(api.stripe.linkStripeCustomerByEmail);
    const hasTriggered = useRef(false);

    useEffect(() => {
        if (hasTriggered.current) return;
        if (searchParams.get("stripe_link") !== "1") return;
        if (!isAuthenticated) return;

        const email = getPendingStripeLink();
        if (!email) return;

        hasTriggered.current = true;

        const link = async () => {
            try {
                const result = await linkStripeCustomer({ email });
                if (result.success) {
                    toast.success(result.message);
                } else {
                    toast.error(result.message);
                }
            } catch (error: unknown) {
                toast.error(error instanceof Error ? error.message : "Stripe連携中にエラーが発生しました");
            } finally {
                clearPendingStripeLink();
                // Remove stripe_link param from URL
                const params = new URLSearchParams(searchParams.toString());
                params.delete("stripe_link");
                const newQuery = params.toString();
                router.replace(newQuery ? `${pathname}?${newQuery}` : pathname);
            }
        };

        link();
    }, [isAuthenticated, searchParams, linkStripeCustomer, router, pathname]);

    return null;
}
