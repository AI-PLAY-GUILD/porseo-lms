"use client";

import { jaJP } from "@clerk/localizations";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { type ReactNode, Suspense } from "react";
import StripeLinkAutoTrigger from "../src/components/auth/StripeLinkAutoTrigger";
import UserSync from "../src/components/auth/UserSync";

const customJaJP = {
    ...jaJP,
    signIn: {
        ...jaJP.signIn,
        start: {
            ...jaJP.signIn?.start,
            title: "AI PLAY GUILDにサインイン",
            subtitle: "Discordアカウントを作成し、ログインしてください",
        },
    },
    signUp: {
        ...jaJP.signUp,
        start: {
            ...jaJP.signUp?.start,
            title: "AI PLAY GUILDに登録",
            subtitle: "Discordアカウントを作成し、ログインしてください",
        },
    },
};

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
    return (
        <ClerkProvider
            publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
            localization={customJaJP}
            signUpUrl="/join"
        >
            <ConvexProviderWithClerk useAuth={useAuth} client={convex}>
                <UserSync />
                <Suspense>
                    <StripeLinkAutoTrigger />
                </Suspense>
                {children}
            </ConvexProviderWithClerk>
        </ClerkProvider>
    );
}
