"use client";

import { useUser } from "@clerk/nextjs";
import { useAction, useConvexAuth, useMutation } from "convex/react";
import { useEffect } from "react";
import { api } from "../../../convex/_generated/api";

export default function UserSync() {
    const { user, isLoaded } = useUser();
    const syncUser = useMutation(api.users.syncCurrentUser);
    const createCustomer = useAction(api.stripe.createCustomer);

    const { isAuthenticated } = useConvexAuth();

    useEffect(() => {
        console.log(
            "[UserSync] useEffect実行 isLoaded:",
            isLoaded,
            "user:",
            !!user,
            "isAuthenticated:",
            isAuthenticated,
        );
        const sync = async () => {
            if (!isLoaded || !user) return;

            console.log("[UserSync] ユーザー同期開始");

            // Token check removed for security (Issue #9 - JWT token was logged to console)

            // 1. 基本情報を同期
            await syncUser();
            console.log("[UserSync] 基本情報同期完了");

            // 認証が完了していない場合は、認証が必要なアクションをスキップ
            if (!isAuthenticated) return;

            try {
                // 2. Stripe Customer作成 & Discordロール取得・保存（サーバーサイド）
                // Security fix (Issue #8): Roles are now saved server-side in createCustomer
                console.log("[UserSync] Stripe Customer作成開始");
                await createCustomer({});
                console.log("[UserSync] Stripe Customer作成完了");
            } catch (error) {
                console.error("[UserSync] エラー: 外部サービス同期失敗:", error);
                console.error("Failed to sync external services:", error);
            }
        };

        sync();
    }, [isLoaded, user, isAuthenticated, syncUser, createCustomer]);

    return null;
}
