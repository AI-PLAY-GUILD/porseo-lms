"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useEffect } from "react";

export default function UserSync() {
    const { user, isLoaded } = useUser();
    const syncUser = useMutation(api.users.syncUser);
    const getDiscordRoles = useAction(api.discord.getDiscordRoles);
    const updateDiscordRoles = useMutation(api.users.updateDiscordRoles);

    useEffect(() => {
        const sync = async () => {
            if (!isLoaded || !user) return;

            // 1. 基本情報を同期
            await syncUser({
                clerkId: user.id,
                email: user.primaryEmailAddress?.emailAddress ?? "",
                name: user.fullName ?? user.username ?? "Unknown",
                imageUrl: user.imageUrl,
            });

            try {
                // 2. Discordロールを同期 (サーバーサイドでトークン取得)
                const roles = await getDiscordRoles({});

                // 3. DBにロールを保存
                await updateDiscordRoles({
                    clerkId: user.id,
                    discordRoles: roles,
                });
            } catch (error) {
                console.error("Failed to sync Discord roles:", error);
            }
        };

        sync();
    }, [isLoaded, user, syncUser, getDiscordRoles, updateDiscordRoles]);

    return null;
}
