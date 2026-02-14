"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useAction, useConvexAuth } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useEffect } from "react";

export default function UserSync() {
    const { user, isLoaded } = useUser();
    const syncUser = useMutation(api.users.syncCurrentUser);
    const createCustomer = useAction(api.stripe.createCustomer);

    const { isAuthenticated } = useConvexAuth();

    useEffect(() => {
        const sync = async () => {
            if (!isLoaded || !user) return;

            // Token check removed for security (Issue #9 - JWT token was logged to console)

            // 1. 基本情報を同期
            await syncUser();

            // 認証が完了していない場合は、認証が必要なアクションをスキップ
            if (!isAuthenticated) return;

            try {
                // 2. Stripe Customer作成 & Discordロール取得・保存（サーバーサイド）
                // Security fix (Issue #8): Roles are now saved server-side in createCustomer
                await createCustomer({});
            } catch (error) {
                console.error("Failed to sync external services:", error);
            }
        };

        sync();
    }, [isLoaded, user, isAuthenticated, syncUser, createCustomer]);

    return null;
}
