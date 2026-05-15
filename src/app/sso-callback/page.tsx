"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SSOCallbackContent() {
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get("redirect_url") || undefined;

    return (
        <AuthenticateWithRedirectCallback
            signInFallbackRedirectUrl={redirectUrl}
            signInForceRedirectUrl={redirectUrl}
            signUpFallbackRedirectUrl={redirectUrl}
            signUpForceRedirectUrl={redirectUrl}
        />
    );
}

export default function SSOCallback() {
    return (
        <Suspense>
            <SSOCallbackContent />
        </Suspense>
    );
}
