"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { useMutation, useAction, useConvexAuth } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useEffect } from "react";

export default function UserSync() {
    const { user, isLoaded } = useUser();
    const syncUser = useMutation(api.users.syncUser);
    const getDiscordRoles = useAction(api.stripe.getDiscordRolesV2);
    const updateDiscordRoles = useMutation(api.users.updateDiscordRoles);
    const createCustomer = useAction(api.stripe.createCustomer);

    const { isAuthenticated } = useConvexAuth();
    const { getToken } = useAuth();

    useEffect(() => {
        const sync = async () => {
            if (!isLoaded || !user) return;

            // DEBUG: Check token
            const token = await getToken({ template: "convex" });
            console.log("DEBUG: Clerk Token for Convex:", token);

            // 1. 基本情報を同期 (これは認証不要でも動くように設計されている場合が多いが、念のため)
            await syncUser({
                clerkId: user.id,
                email: user.primaryEmailAddress?.emailAddress ?? "",
                name: user.fullName ?? user.username ?? "Unknown",
                imageUrl: user.imageUrl,
            });

            // 認証が完了していない場合は、認証が必要なアクションをスキップ
            if (!isAuthenticated) return;

            try {
                // 2. Stripe Customer作成 (存在しない場合)
                await createCustomer({});

                // 3. Discordロールを同期 (サーバーサイドでトークン取得)
                const roles = await getDiscordRoles({});

                // 4. DBにロールを保存
                await updateDiscordRoles({
                    clerkId: user.id,
                    discordRoles: roles,
                });
            } catch (error) {
                console.error("Failed to sync external services:", error);
            }
        };

        sync();
    }, [isLoaded, user, isAuthenticated, syncUser, getDiscordRoles, updateDiscordRoles]);

    return null;
}
