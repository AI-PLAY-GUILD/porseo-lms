"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { useMutation, useAction, useConvexAuth } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useEffect } from "react";

export default function UserSync() {
    const { user, isLoaded } = useUser();
    const syncUser = useMutation(api.users.syncCurrentUser);
    const createCustomer = useAction(api.stripe.createCustomer);

    const { isAuthenticated } = useConvexAuth();
    const { getToken } = useAuth();

    useEffect(() => {
        const sync = async () => {
            if (!isLoaded || !user) return;

            // DEBUG: Check token
            try {
                const token = await getToken({ template: "convex" });
                console.log("DEBUG: Clerk Token for Convex:", token);
            } catch (e) {
                console.error("DEBUG: Failed to get token:", e);
            }

            // 1. 基本情報を同期
            await syncUser({});

            // 認証が完了していない場合は、認証が必要なアクションをスキップ
            if (!isAuthenticated) return;

            try {
                // 2. Stripe Customer作成 & Discordロール取得 (相乗り作戦)
                // createCustomer内でinternal mutationを使ってロールを同期するように変更済み
                await createCustomer({});
            } catch (error) {
                console.error("Failed to sync external services:", error);
            }
        };

        sync();
    }, [isLoaded, user, isAuthenticated, syncUser, createCustomer, getToken]);

    return null;
}
